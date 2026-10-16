import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Workspace from "./Workspace";
import { api, login } from "./api";
import type { Session } from "./api";
vi.mock("./api", async () => {
  const real = await vi.importActual<any>("./api");
  return {
    ...real,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      defaults: { baseURL: "/api/v1" },
    },
    login: vi.fn(),
  };
});
const admin = {
  user: { id: 1, name: "Operator Demo", roles: [{ name: "Super Admin" }] },
  permissions: [],
  super_admin: true,
};
const viewer = {
  user: { id: 2, name: "Klien Demo", roles: [{ name: "Client Viewer" }] },
  permissions: [
    "dashboard.read",
    "master.read",
    "inventory.read",
    "order.read",
    "inbound.read",
    "billing.read",
    "reports.read",
  ],
  super_admin: false,
};
const dashboard = {
  kpi: {
    available: 123,
    physical: 140,
    reserved: 17,
    quarantine: 0,
    open_orders: 3,
    dispatched: 2,
    inbound: 1,
  },
  activity: [],
  queue: [],
  warehouses: [],
  recent_orders: [],
  low_stock: [],
  expiring: [],
  sla_warning: 0,
};
function mocks(session: Session = admin) {
  vi.mocked(api.get).mockImplementation(
    async (url: any) =>
      ({
        data:
          url === "/me"
            ? session
            : String(url).startsWith("/dashboard")
              ? dashboard
              : String(url).startsWith("/notifications")
                ? { data: [] }
                : String(url).startsWith("/master/clients")
                  ? { data: [{ id: 1, name: "Client A" }] }
                  : String(url).startsWith("/master/warehouses")
                    ? { data: [{ id: 1, name: "Warehouse A" }] }
                    : String(url).startsWith("/master/products")
                      ? {
                          data: [
                            {
                              id: 1,
                              name: "Product A",
                              sku: "SKU-A",
                              client_id: 1,
                            },
                          ],
                        }
                      : {
                          data: [],
                          meta: { current_page: 1, last_page: 1, total: 0 },
                        },
      }) as any,
  );
  vi.mocked(api.post).mockResolvedValue({ data: { data: {} } } as any);
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks();
});
afterEach(cleanup);
describe("ALDEF workspace", () => {
  it("uses operational API values on the dashboard and supports filtering", async () => {
    render(<Workspace />);
    await screen.findByText("Selamat datang, Operator");
    expect(await screen.findByText("123")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        (
          screen.getByRole("combobox", {
            name: "Pilih klien",
          }) as HTMLSelectElement
        ).options.length,
      ).toBe(2),
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Pilih klien" }),
      "1",
    );
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/dashboard?client_id=1"),
    );
  });
  it("presents client read menus without staff actions", async () => {
    mocks(viewer);
    render(<Workspace />);
    await screen.findByText("Selamat datang, Klien");
    expect(screen.getAllByText("PORTAL KLIEN").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Buat pesanan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pengguna & akses" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Picking" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pesanan" }));
    await screen.findByText(
      "Kelola pesanan, alokasi stok, dan pengiriman parsial.",
    );
    expect(
      screen.queryByRole("button", { name: "Buat pesanan" }),
    ).not.toBeInTheDocument();
  });
  it("submits an order with client warehouse SKU quantities and recipient", async () => {
    render(<Workspace />);
    await screen.findByText("Selamat datang, Operator");
    await waitFor(() =>
      expect(
        (
          screen.getByRole("combobox", {
            name: "Pilih klien",
          }) as HTMLSelectElement
        ).options.length,
      ).toBe(2),
    );
    await userEvent.click(screen.getByRole("button", { name: "Buat pesanan" }));
    await userEvent.selectOptions(
      screen.getByLabelText(/Klien pemilik barang/),
      "1",
    );
    await userEvent.selectOptions(screen.getByLabelText(/^Gudang/), "1");
    await userEvent.type(screen.getByLabelText(/^Penerima/), "Nadia");
    await userEvent.type(screen.getByLabelText(/Alamat tujuan/), "Jakarta");
    await userEvent.selectOptions(screen.getByLabelText(/Produk \/ SKU/), "1");
    await userEvent.click(screen.getByRole("button", { name: "Simpan data" }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/documents",
        expect.objectContaining({
          type: "order",
          client_id: 1,
          warehouse_id: 1,
          meta: {
            recipient: "Nadia",
            address: "Jakarta",
            direction: "add",
            count_type: "cycle",
          },
          lines: [{ product_id: 1, quantity: 1 }],
        }),
      ),
    );
  });
  it("logs in through the SPA session helper and displays server errors", async () => {
    vi.mocked(api.get).mockImplementation(async (url: any) => {
      if (url === "/me") throw Error("Unauthorized");
      return { data: [] } as any;
    });
    vi.mocked(login).mockRejectedValueOnce(
      Error("Email atau password tidak sesuai."),
    );
    render(<Workspace />);
    await screen.findByText("Masuk ke Fulfillment Center");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "invalid-password");
    await userEvent.click(
      screen.getByRole("button", { name: "Masuk workspace" }),
    );
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Email atau password tidak sesuai.",
    );
    expect(login).toHaveBeenCalledWith("user@example.com", "invalid-password");
  });
  it("fills the demo account credentials from the demo button", async () => {
    vi.mocked(api.get).mockImplementation(async (url: any) => {
      if (url === "/me") throw Error("Unauthorized");
      return { data: [] } as any;
    });
    render(<Workspace />);
    await screen.findByText("Masuk ke Fulfillment Center");
    await userEvent.click(
      screen.getByRole("button", { name: "Coba akun demo" }),
    );
    expect(screen.getByLabelText("Email")).toHaveValue("demo@aldeftech.com");
    expect(screen.getByLabelText("Password")).toHaveValue("demo");
    expect(login).not.toHaveBeenCalledWith("demo@aldeftech.com", "demo");
  });
  it("shows the new login branding", async () => {
    vi.mocked(api.get).mockImplementation(async (url: any) => {
      if (url === "/me") throw Error("Unauthorized");
      return { data: [] } as any;
    });
    render(<Workspace />);
    await screen.findByText("SELAMAT DATANG DI ALDEF FULFILLMENT CENTER");
    expect(screen.getByAltText("ALDEF Fulfillment Center")).toHaveAttribute(
      "src",
      "/aldef-fulfillment-center.png",
    );
    expect(
      screen.getByText("ALDEFTECH - FULFILLMENT CENTER OPERATIONS"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Aldef Tech · Asia\/Jakarta/)).toBeInTheDocument();
    expect(screen.queryByText(/Lingkungan lokal/)).not.toBeInTheDocument();
  });
  it("edits the profile and uploads a profile photo", async () => {
    const user = {
      id: 1,
      name: "Operator Demo",
      email: "ops@example.com",
      roles: [{ id: 1, name: "Super Admin" }],
    };
    mocks({ ...admin, user });
    vi.mocked(api.put).mockResolvedValue({
      data: {
        ...admin,
        user: { ...user, name: "Operator Baru", updated_at: "x" },
      },
    } as any);
    vi.mocked(api.post).mockResolvedValue({
      data: { ...admin, user: { ...user, avatar_url: "/avatars/1?v=abc" } },
    } as any);
    render(<Workspace />);
    await screen.findByText("Selamat datang, Operator");
    expect(screen.queryByText(/Lingkungan lokal/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Profil saya" }));
    await screen.findByRole("tab", { name: /Informasi pribadi/ });
    const name = screen.getByLabelText(/Nama lengkap/);
    await userEvent.clear(name);
    await userEvent.type(name, "Operator Baru");
    await userEvent.type(screen.getByLabelText(/Jabatan/), "Supervisor");
    await userEvent.click(
      screen.getByRole("button", { name: /Simpan perubahan/ }),
    );
    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("/profile", {
        name: "Operator Baru",
        email: "ops@example.com",
        phone: "",
        job_title: "Supervisor",
      }),
    );
    const photo = new File(["img"], "me.png", { type: "image/png" });
    await userEvent.upload(screen.getByTestId("avatar-input"), photo);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/profile/avatar",
        expect.any(FormData),
      ),
    );
    expect(
      (await screen.findAllByAltText("Foto profil Operator Demo"))[0],
    ).toHaveAttribute("src", "/api/v1/avatars/1?v=abc");
  });
  it("traces a batch from receiving to the customer shipment", async () => {
    const trace = {
      query: "LOT-26-10",
      matched_by: ["batch"],
      products: [
        { id: 1, sku: "SKU-A", name: "Product A" },
        { id: 2, sku: "SKU-B", name: "Product B" },
      ],
      summary: {
        received: 10,
        on_hand: 7,
        reserved: 1,
        dispatched: 3,
        returned: 0,
        locations: 1,
      },
      positions: [
        {
          id: 5,
          product: { id: 1, sku: "SKU-A", name: "Product A" },
          warehouse: "Warehouse A",
          location: "A-01-01",
          batch: "LOT-26-10",
          serial: "",
          condition: "sellable",
          quantity: 7,
          reserved: 1,
        },
        {
          id: 6,
          product: { id: 1, sku: "SKU-A", name: "Product A" },
          warehouse: "Warehouse A",
          location: "RCV-01",
          batch: "LOT-26-10",
          serial: "",
          condition: "sellable",
          quantity: 0,
          reserved: 0,
        },
      ],
      timeline: [
        {
          id: 9,
          event: "dispatch",
          quantity_delta: -3,
          reserved_delta: -3,
          sku: "SKU-A",
          batch: "LOT-26-10",
          location: "STG-01",
          warehouse: "Warehouse A",
          created_at: "2026-10-16T03:00:00+00:00",
          user: "Shipping Staff",
          document: { id: 44, number: "ALDEF-ORDER-1", type: "order" },
        },
        {
          id: 1,
          event: "receiving",
          quantity_delta: 10,
          reserved_delta: 0,
          sku: "SKU-A",
          batch: "LOT-26-10",
          location: "RCV-01",
          warehouse: "Warehouse A",
          created_at: "2026-10-15T03:00:00+00:00",
          user: "Inbound Staff",
          document: { id: 40, number: "ALDEF-INBOUND-1", type: "inbound" },
        },
      ],
      timeline_total: 2,
      documents: [
        {
          id: 44,
          number: "ALDEF-ORDER-1",
          type: "order",
          status: "dispatched",
          recipient: "Sinta Maharani",
          address: "Bandung",
          courier: "JNE",
          tracking_number: "JNE123456",
          quantity: 3,
          dispatched: 3,
        },
      ],
    };
    mocks();
    const base = vi.mocked(api.get).getMockImplementation()!;
    vi.mocked(api.get).mockImplementation(async (url: any) =>
      String(url).startsWith("/trace")
        ? ({ data: { data: trace } } as any)
        : String(url) === "/documents/44"
          ? ({
              data: {
                data: {
                  id: 44,
                  number: "ALDEF-ORDER-1",
                  type: "order",
                  status: "dispatched",
                  lines: [],
                  meta: {},
                },
              },
            } as any)
          : base(url),
    );
    render(<Workspace />);
    await screen.findByText("Selamat datang, Operator");
    await userEvent.click(screen.getByRole("button", { name: "Lacak barang" }));
    await userEvent.type(
      screen.getByLabelText("Kode yang dilacak"),
      "LOT-26-10{enter}",
    );
    await screen.findByText("Cocok dengan Batch / lot");
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/trace?q=LOT-26-10"),
    );
    expect(screen.getByText("Diserahkan ke kurir")).toBeInTheDocument();
    expect(screen.getByText("Diterima di gudang")).toBeInTheDocument();
    expect(screen.getByText("Sinta Maharani")).toBeInTheDocument();
    expect(screen.getByText("JNE123456")).toBeInTheDocument();
    expect(screen.getByText("A-01-01")).toBeInTheDocument();
    expect(screen.queryByText("RCV-01", { selector: "strong" })).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Tampilkan 1 saldo kosong" }),
    );
    expect(
      screen.getByText("RCV-01", { selector: "strong" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /SKU-B/ }));
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith("/trace?q=LOT-26-10&product_id=2"),
    );
    await userEvent.click(
      (await screen.findAllByRole("button", { name: "ALDEF-ORDER-1" }))[0],
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/documents/44"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
  it("hints that orders can be searched by tracking number and recipient", async () => {
    render(<Workspace />);
    await screen.findByText("Selamat datang, Operator");
    expect(
      screen.getByPlaceholderText("Cari pesanan, resi, penerima…"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pesanan" }));
    expect(
      await screen.findByPlaceholderText(
        "Cari nomor, resi, penerima, atau SKU…",
      ),
    ).toBeInTheDocument();
  });
  it("locks email and password for the demo account", async () => {
    mocks({
      ...admin,
      demo: true,
      user: {
        id: 9,
        name: "Demo Super Admin",
        email: "demo@aldeftech.com",
        roles: [{ id: 1, name: "Super Admin" }],
      },
    });
    render(<Workspace />);
    await screen.findByText("Selamat datang, Demo");
    await userEvent.click(screen.getByRole("button", { name: "Profil saya" }));
    expect(await screen.findByLabelText(/^Email/)).toBeDisabled();
    expect(screen.getByText("akun demo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: /Keamanan/ }));
    expect(screen.getByLabelText(/Password saat ini/)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Ganti password/ }),
    ).toBeDisabled();
  });
});
