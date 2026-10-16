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
