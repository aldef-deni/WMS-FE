import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import type { FormEvent } from "react";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ClipboardList,
  ScanLine,
  Box,
  Truck,
  RotateCcw,
  ArrowLeftRight,
  ClipboardCheck,
  Receipt,
  BarChart3,
  Settings,
  Users,
  ShieldCheck,
  FileClock,
  LogOut,
  Search,
  Bell,
  ArrowUpRight,
  Plus,
  Download,
  RefreshCw,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Warehouse,
  Layers,
  CalendarDays,
  Activity,
  X,
  Check,
  ExternalLink,
  CirclePlay,
  UserRound,
} from "lucide-react";
import { api, login, errorText, key, fmt, money, date, localDate } from "./api";
import type { Row, Session } from "./api";
import {
  Badge,
  Panel,
  Drawer,
  Busy,
  Empty,
  SearchBox,
  Pager,
  Fields,
} from "./components";
import type { Field } from "./components";
import { modules, masterFields, actions, option, enums } from "./modules";
import Profile, { Avatar } from "./Profile";
import "./Workspace.css";
import { Integrations, QueueExports, EmailSimulator } from "./Extras";
const ActivityChart = lazy(() => import("./ActivityChart"));
const groups = [
  {
    label: "WORKSPACE",
    items: [
      ["dashboard", "Ringkasan", LayoutDashboard],
      ["inbound", "Inbound", ArrowDownToLine],
      ["inventory", "Persediaan", Package],
      ["order", "Pesanan", ClipboardList],
    ],
  },
  {
    label: "OPERASIONAL",
    items: [
      ["picking", "Picking", ScanLine],
      ["packing", "Packing", Box],
      ["shipping", "Shipping", Truck],
      ["transfer", "Mutasi & replenishment", ArrowLeftRight],
      ["return", "Retur & QC", RotateCcw],
      ["count", "Stock opname", ClipboardCheck],
      ["adjustment", "Adjustment", Layers],
    ],
  },
  {
    label: "BISNIS & DATA",
    items: [
      ["invoices", "Invoice", Receipt],
      ["charges", "Biaya layanan", Receipt],
      ["reports", "Laporan", BarChart3],
      ["ledger", "Kartu stok", FileClock],
    ],
  },
  {
    label: "MASTER DATA",
    items: [
      ["clients", "Klien", Users],
      ["warehouses", "Gudang", Warehouse],
      ["locations", "Zona & lokasi", Layers],
      ["products", "Produk & SKU", Package],
      ["catalogs", "Kemasan & kurir", Truck],
      ["tariffs", "Tarif layanan", Receipt],
      ["integrations", "Integrasi lokal", Settings],
    ],
  },
  {
    label: "AKUN",
    items: [["profile", "Profil saya", UserRound]],
  },
  {
    label: "ADMINISTRASI",
    items: [
      ["users", "Pengguna & akses", Users],
      ["roles", "Role & permission", ShieldCheck],
      ["settings", "Pengaturan", Settings],
      ["audit", "Audit log", FileClock],
    ],
  },
];
function useRemote(url: string | null, revision = 0) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!url) {
      setData(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(url)
      .then((r) => {
        if (active) setData(r.data);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url, revision]);
  return { data, error, loading };
}
const val = (r: any, p: string) => p.split(".").reduce((o, k) => o?.[k], r);
function Cell({ row, path }: { row: Row; path: string }) {
  const v = val(row, path);
  if (["status", "condition"].includes(path)) return <Badge status={v} />;
  if (["total", "paid", "rate", "amount"].includes(path))
    return <span className="numeric">{money(v)}</span>;
  if (path.endsWith("_at")) return <span className="muted">{date(v)}</span>;
  if (Array.isArray(v))
    return (
      <span>
        {path === "permissions"
          ? `${v.length} permission`
          : v.map((x) => (typeof x === "string" ? x : x.name)).join(", ") ||
            "—"}
      </span>
    );
  if (v && typeof v === "object")
    return (
      <span>
        {Object.entries(v)
          .map(([k, x]) => `${k}: ${String(x)}`)
          .join(" · ")}
      </span>
    );
  if (
    [
      "quantity",
      "reserved",
      "available",
      "quantity_after",
      "quantity_delta",
      "reserved_delta",
      "capacity",
      "units",
    ].includes(path)
  )
    return <span className="numeric">{fmt(v)}</span>;
  return (
    <span
      className={
        ["number", "sku", "product.sku"].includes(path) ? "mono strong" : ""
      }
    >
      {v ?? "—"}
    </span>
  );
}
const DEMO_ACCOUNT = { email: "demo@aldeftech.com", password: "demo" };
function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onLogin(await login(email, password));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-layout">
      <div className="login-story">
        <div className="login-logo">
          <img
            src="/aldef-fulfillment-center.png"
            alt="ALDEF Fulfillment Center"
          />
        </div>
        <div>
          <span className="eyebrow">YOUR FULFILLMENT, CONNECTED.</span>
          <h1>
            Satu kendali.
            <br />
            Setiap pergerakan.
          </h1>
          <p>
            Dari barang tiba hingga pesanan terkirim.
            <br />
            Workspace operasional untuk tim dan klien Anda.
          </p>
          <div className="login-features">
            <span>
              <ShieldCheck size={19} /> Akses sesuai penugasan
            </span>
            <span>
              <Package size={19} /> Stok tercatat per lokasi
            </span>
            <span>
              <Activity size={19} /> Aktivitas terhubung
            </span>
          </div>
        </div>
        <small>ALDEFTECH - FULFILLMENT CENTER OPERATIONS</small>
      </div>
      <div className="login-form">
        <div>
          <span className="eyebrow">
            SELAMAT DATANG DI ALDEF FULFILLMENT CENTER
          </span>
          <h2>Masuk ke Fulfillment Center</h2>
          <p>Gunakan akun operasional atau portal klien Anda.</p>
          <form onSubmit={submit}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Memverifikasi…" : "Masuk workspace"}
              <ArrowUpRight size={18} />
            </button>
            <button
              type="button"
              className="demo-login"
              disabled={busy}
              onClick={() => {
                setEmail(DEMO_ACCOUNT.email);
                setPassword(DEMO_ACCOUNT.password);
                setError("");
              }}
            >
              <CirclePlay size={18} /> Coba akun demo
            </button>
          </form>
          <div className="local-note">
            <span className="live-dot" /> Aldef Tech · Asia/Jakarta
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Workspace() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [revision, setRevision] = useState(0);
  const [client, setClient] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [notice, setNotice] = useState("");
  const [notif, setNotif] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [form, setForm] = useState<{ kind: string; row?: Row } | null>(null);
  const [action, setAction] = useState("");
  const [refs, setRefs] = useState<Record<string, Row[]>>({
    clients: [],
    warehouses: [],
    locations: [],
    products: [],
    catalogs: [],
    roles: [],
    permissions: [],
    orders: [],
  });
  useEffect(() => {
    api
      .get("/me")
      .then((r) => setSession(r.data))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  const can = useCallback(
    (p: string) =>
      !!session && (session.super_admin || session.permissions.includes(p)),
    [session],
  );
  useEffect(() => {
    if (!session) return;
    let active = true;
    const kinds = [
      "clients",
      "warehouses",
      "locations",
      "products",
      "catalogs",
      ...(can("settings.read") ? ["roles"] : []),
    ];
    Promise.all(
      kinds.map(async (kind) => [
        kind,
        (await api.get("/master/" + kind + "?per_page=100")).data.data,
      ]),
    )
      .then(async (entries) => {
        const rest: any = {};
        if (can("settings.read"))
          rest.permissions = (await api.get("/permissions")).data.data;
        if (can("order.read"))
          rest.orders = (
            await api.get("/documents?type=order&per_page=100")
          ).data.data;
        if (can("picking.assign"))
          rest.staff = (await api.get("/staff")).data.data;
        if (active)
          setRefs(
            Object.fromEntries(entries.concat(Object.entries(rest))) as Record<
              string,
              Row[]
            >,
          );
      })
      .catch((e) => setNotice(errorText(e)));
    return () => {
      active = false;
    };
  }, [session, revision, can]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  const filters = new URLSearchParams({
    ...(client ? { client_id: client } : {}),
    ...(warehouse ? { warehouse_id: warehouse } : {}),
  }).toString();
  const scoped = (url: string) =>
    url + (url.includes("?") ? "&" : "?") + filters;
  const dashboard = useRemote(session ? scoped("/dashboard") : null, revision);
  const notifications = useRemote(
    session ? scoped("/notifications") : null,
    revision,
  );
  function navigate(next: string) {
    setPage(next);
    setDetail(null);
    setAction("");
    setSidebar(false);
    setGlobalSearch("");
  }
  async function openDetail(row: Row) {
    try {
      setDetail(
        modules[page]?.type
          ? (await api.get("/documents/" + row.id)).data.data
          : row,
      );
      setAction("");
    } catch (e) {
      setNotice(errorText(e));
    }
  }
  function changed(text = "Perubahan berhasil disimpan.") {
    setRevision((v) => v + 1);
    setNotice(text);
  }
  if (checking) return <Busy />;
  if (!session) return <Login onLogin={setSession} />;
  const title =
    page === "dashboard"
      ? "Ringkasan Operasional"
      : page === "reports"
        ? "Laporan & Analitik"
        : page === "profile"
          ? "Profil Saya"
          : (modules[page]?.title ?? page);
  const editable = modules[page]?.master
    ? can(
        ["users", "roles"].includes(page)
          ? "users.manage"
          : page === "settings"
            ? "settings.write"
            : page === "tariffs"
              ? "billing.write"
              : page + ".write",
      )
    : can((modules[page]?.type ?? page) + ".write");
  const portal = session.user.roles.some((r: Row) =>
    r.name.startsWith("Client"),
  );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebar ? "open" : ""}`}>
        <div className="brand">
          <img src="/aldef-logo-2026.png" alt="ALDEF Tech" />
          <div>
            <strong>ALDEF</strong>
            <span>FULFILLMENT CENTER</span>
          </div>
          <button
            className="mobile-close icon-button"
            onClick={() => setSidebar(false)}
            aria-label="Tutup navigasi"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="live-dot" />{" "}
          {portal ? "PORTAL KLIEN" : "OPERATIONS WORKSPACE"}
        </div>
        <nav>
          {groups.map((g) => (
            <div className="nav-group" key={g.label}>
              <p>{g.label}</p>
              {g.items
                .filter(
                  ([id]) =>
                    id === "dashboard" ||
                    id === "profile" ||
                    can(
                      id === "reports"
                        ? "reports.read"
                        : (modules[String(id)]?.permission ?? "none"),
                    ),
                )
                .map(([id, label, Icon]) => {
                  const I = Icon as any;
                  return (
                    <button
                      key={String(id)}
                      className={page === id ? "active" : ""}
                      onClick={() => navigate(String(id))}
                    >
                      <I size={18} />
                      <span>{String(label)}</span>
                      {page === id && <span className="nav-mark" />}
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            className="sidebar-profile"
            onClick={() => navigate("profile")}
            aria-label="Buka profil saya"
          >
            <Avatar user={session.user} />
            <div>
              <strong>{session.user.name}</strong>
              <span>{session.user.roles[0]?.name}</span>
            </div>
          </button>
          <button
            aria-label="Keluar"
            onClick={async () => {
              await api.post("/logout");
              setSession(null);
              setClient("");
              setWarehouse("");
              navigate("dashboard");
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {sidebar && (
        <div className="sidebar-backdrop" onClick={() => setSidebar(false)} />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="mobile-menu icon-button"
              aria-label="Buka navigasi"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            <div className="top-search">
              <Search size={16} />
              <input
                placeholder="Cari pesanan…"
                aria-label="Pencarian pesanan"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (page !== "order" && can("order.read")) setPage("order");
                }}
              />
              <kbd>/</kbd>
            </div>
            <button
              className="notification-button icon-button"
              aria-label="Notifikasi"
              onClick={() => setNotif(!notif)}
            >
              <Bell size={19} />
              {!!notifications.data?.data?.length && <i />}
            </button>
            <button
              className="avatar-button"
              aria-label="Profil pengguna"
              onClick={() => navigate("profile")}
            >
              <Avatar user={session.user} className="small" />
            </button>
          </div>
          {notif && (
            <div className="notification-popover">
              <h3>Notifikasi operasional</h3>
              {notifications.data?.data?.length ? (
                notifications.data.data.map((n: any, i: number) => (
                  <div key={i}>
                    <AlertTriangle size={17} />
                    <span>
                      <strong>{n.title}</strong>
                      <p>{n.body}</p>
                    </span>
                  </div>
                ))
              ) : (
                <p>Tidak ada peringatan operasional saat ini.</p>
              )}
            </div>
          )}
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="page-kicker">
                <span className="live-dot" />{" "}
                {portal ? "CLIENT WORKSPACE" : "ALDEF OPERATIONS"}
                <span className="separator">/</span>{" "}
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "full",
                  timeZone: "Asia/Jakarta",
                }).format(new Date())}
              </div>
              <h1>
                {page === "dashboard"
                  ? `Selamat datang, ${session.user.name.split(" ")[0]}`
                  : title}
                <span className="title-dot">.</span>
              </h1>
              <p>
                {page === "dashboard"
                  ? "Semua yang Anda butuhkan untuk menjaga operasional tetap berjalan."
                  : page === "reports"
                    ? "Evaluasi stok, aktivitas, kapasitas, dan pendapatan layanan."
                    : page === "profile"
                      ? "Kelola informasi akun, foto profil, keamanan, dan aktivitas Anda."
                      : modules[page]?.subtitle}
              </p>
            </div>
            {page !== "profile" && (
              <div className="heading-actions">
                <button
                  className="secondary"
                  onClick={() => changed("Data diperbarui.")}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                {page === "dashboard" && can("order.write") && (
                  <button
                    className="primary"
                    onClick={() => setForm({ kind: "document:order" })}
                  >
                    <Plus size={17} />
                    Buat pesanan
                  </button>
                )}
                {page !== "dashboard" &&
                  page !== "reports" &&
                  ((editable && modules[page]?.master) ||
                    (editable && modules[page]?.type) ||
                    (page === "invoices" && can("billing.write"))) && (
                    <button
                      className="primary"
                      onClick={() =>
                        setForm({
                          kind: modules[page]?.master
                            ? "master:" + page
                            : page === "invoices"
                              ? "invoice"
                              : "document:" + modules[page].type,
                        })
                      }
                    >
                      <Plus size={17} />
                      Buat{" "}
                      {page === "order"
                        ? "pesanan"
                        : modules[page]?.master
                          ? "data"
                          : page === "invoices"
                            ? "invoice"
                            : "dokumen"}
                    </button>
                  )}
              </div>
            )}
          </div>
          {page !== "profile" && (
            <div className="scope-bar">
              <div>
                <Warehouse size={17} />
                <select
                  aria-label="Pilih gudang"
                  value={warehouse}
                  onChange={(e) => {
                    setWarehouse(e.target.value);
                    setDetail(null);
                  }}
                >
                  <option value="">Semua gudang</option>
                  {refs.warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <span className="scope-divider" />
                <Users size={17} />
                <select
                  aria-label="Pilih klien"
                  value={client}
                  onChange={(e) => {
                    setClient(e.target.value);
                    setDetail(null);
                  }}
                >
                  <option value="">Semua klien</option>
                  {refs.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="sync-label">
                <span className="live-dot" />
                Data operasional terhubung
              </span>
            </div>
          )}
          {page === "profile" ? (
            <Profile
              session={session}
              onSession={setSession}
              onToast={setNotice}
            />
          ) : page === "dashboard" ? (
            <Dashboard
              data={dashboard.data}
              loading={dashboard.loading}
              error={dashboard.error}
              can={can}
              navigate={navigate}
              onDetail={async (row) => {
                setPage("order");
                try {
                  setDetail((await api.get("/documents/" + row.id)).data.data);
                } catch (e) {
                  setNotice(errorText(e));
                }
              }}
            />
          ) : page === "integrations" ? (
            <Integrations refs={refs} can={can} />
          ) : page === "reports" ? (
            <Reports
              url={scoped("/reports")}
              revision={revision}
              filters={filters}
              can={can}
            />
          ) : (
            <DataPage
              name={page}
              filters={filters}
              revision={revision}
              search={globalSearch}
              can={can}
              onDetail={openDetail}
              onEdit={(row) => setForm({ kind: "master:" + page, row })}
              onToast={setNotice}
              onChanged={changed}
              refs={refs}
            />
          )}
          <footer className="workspace-footer">
            <span>
              ALDEFTECH <span>·</span> Fulfillment made clear.
            </span>
            <span>Asia/Jakarta</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{notice}</span>
          <button
            aria-label="Tutup pemberitahuan"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {form && (
        <EditForm
          form={form}
          refs={refs}
          client={client}
          warehouse={warehouse}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            changed();
          }}
        />
      )}
      {detail && (
        <Drawer
          title={detail.number ?? detail.name ?? "Detail data"}
          subtitle={detail.client?.name ?? title}
          wide
          onClose={() => {
            setDetail(null);
            setAction("");
          }}
        >
          {modules[page]?.type ? (
            <DocumentDetail
              document={detail}
              can={can}
              refs={refs}
              action={action}
              setAction={setAction}
              onUpdate={(row) => {
                setDetail(row);
                setAction("");
                changed("Aktivitas berhasil dicatat.");
              }}
              onToast={setNotice}
            />
          ) : page === "invoices" ? (
            <InvoiceDetail
              key={String(detail.id) + String(detail.paid)}
              invoice={detail}
              can={can}
              onUpdated={(row) => {
                setDetail(row);
                changed("Pembayaran dicatat.");
              }}
            />
          ) : (
            <div className="detail-facts">
              {modules[page].columns.map(([k, label]) => (
                <div key={k}>
                  <span>{label}</span>
                  <strong>
                    <Cell row={detail} path={k} />
                  </strong>
                </div>
              ))}
            </div>
          )}
        </Drawer>
      )}
    </div>
  );
}
function Dashboard({
  data,
  loading,
  error,
  can,
  navigate,
  onDetail,
}: {
  data: any;
  loading: boolean;
  error: string;
  can: (p: string) => boolean;
  navigate: (s: string) => void;
  onDetail: (r: Row) => void;
}) {
  if (loading || !data)
    return error ? <div className="error">{error}</div> : <Busy />;
  const cards = [
    [
      "Stok available",
      data.kpi.available,
      "Unit siap dialokasikan",
      Package,
      "blue",
    ],
    [
      "Pesanan aktif",
      data.kpi.open_orders,
      "Dalam proses fulfillment",
      ClipboardList,
      "purple",
    ],
    [
      "Pesanan terkirim",
      data.kpi.dispatched,
      "Dispatch tercatat",
      Truck,
      "green",
    ],
    [
      "Inbound berjalan",
      data.kpi.inbound,
      "Menunggu penyelesaian",
      ArrowDownToLine,
      "orange",
    ],
  ];
  return (
    <>
      {data.financial && (
        <div className="financial-strip">
          <div>
            <Receipt size={18} />
            <span>Tagihan belum dibayar</span>
            <strong>{money(data.financial.outstanding)}</strong>
          </div>
          <div>
            <AlertTriangle size={18} />
            <span>Invoice jatuh tempo</span>
            <strong>{fmt(data.financial.overdue)}</strong>
          </div>
          <div>
            <Activity size={18} />
            <span>Biaya layanan tercatat</span>
            <strong>{money(data.financial.charges)}</strong>
          </div>
        </div>
      )}
      <div className="kpi-grid">
        {cards.map(([label, n, sub, Icon, color]) => {
          const I = Icon as any;
          return (
            <div className="kpi" key={String(label)}>
              <div className="kpi-top">
                <span>{String(label)}</span>
                <span className={`kpi-icon ${color}`}>
                  <I size={19} />
                </span>
              </div>
              <strong>{fmt(n as number)}</strong>
              <div>
                <span className={`tiny-dot ${color}`} />
                {String(sub)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="dashboard-middle">
        <Panel
          title="Aktivitas fulfillment"
          subtitle="Unit inbound dan outbound · 7 hari terakhir"
          action={
            <div className="chart-legend">
              <span>
                <i className="blue" />
                Inbound
              </span>
              <span>
                <i className="orange" />
                Outbound
              </span>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="chart">
                <Busy />
              </div>
            }
          >
            <ActivityChart data={data} />
          </Suspense>
          <div className="chart-foot">
            <span>
              <Activity size={14} />
              Berdasarkan inventory ledger
            </span>
            <strong>
              {fmt(data.kpi.physical)}
              <span> total unit fisik</span>
            </strong>
          </div>
        </Panel>
        <Panel
          title="Antrean pekerjaan"
          subtitle="Prioritaskan aktivitas tim Anda"
          action={
            <span className="count-pill">
              {data.queue.reduce((s: number, r: any) => s + Number(r.total), 0)}
            </span>
          }
        >
          <div className="queue-list">
            {data.queue.slice(0, 5).map((q: any, i: number) => (
              <button
                key={i}
                onClick={() =>
                  navigate(can(q.type + ".read") ? q.type : "dashboard")
                }
              >
                <div
                  className={`queue-icon ${["blue", "purple", "orange", "green"][i % 4]}`}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <strong>{modules[q.type]?.title ?? q.type}</strong>
                  <span>
                    <Badge status={q.status} />
                  </span>
                </div>
                <b>{q.total}</b>
                <ArrowUpRight size={15} />
              </button>
            ))}
            {!data.queue.length && (
              <Empty text="Semua pekerjaan telah selesai." />
            )}
          </div>
          <div className={`sla-note ${data.sla_warning ? "warn" : ""}`}>
            <AlertTriangle size={18} />
            <div>
              <strong>
                {data.sla_warning
                  ? `${data.sla_warning} pesanan melewati SLA`
                  : "SLA dalam pemantauan"}
              </strong>
              <p>
                Periksa antrean secara berkala untuk menjaga waktu dispatch.
              </p>
            </div>
          </div>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel
          title="Pesanan terbaru"
          subtitle="Pergerakan pesanan di seluruh workspace"
          action={
            can("order.read") ? (
              <button className="text-button" onClick={() => navigate("order")}>
                Lihat semua
                <ArrowUpRight size={14} />
              </button>
            ) : null
          }
        >
          {data.recent_orders.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Pesanan</th>
                    <th>Klien / penerima</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((r: Row) => (
                    <tr key={r.id} onClick={() => onDetail(r)}>
                      <td>
                        <strong className="mono">{r.number}</strong>
                        <small>{date(r.created_at)}</small>
                      </td>
                      <td>
                        <strong>{r.client.name}</strong>
                        <small>{r.meta?.recipient}</small>
                      </td>
                      <td className="numeric">
                        {fmt(
                          r.lines.reduce(
                            (s: number, l: Row) => s + l.quantity,
                            0,
                          ),
                        )}
                      </td>
                      <td>
                        <Badge status={r.status} />
                      </td>
                      <td>
                        <ArrowUpRight size={16} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Tidak ada pesanan dalam lingkup akses ini." />
          )}
        </Panel>
        <div className="capacity-panel">
          <Panel title="Kapasitas gudang" subtitle="Unit tersimpan / kapasitas">
            <div className="capacity-list">
              {data.warehouses.map((w: Row) => (
                <div key={w.id}>
                  <div>
                    <Warehouse size={18} />
                    <strong>{w.name}</strong>
                  </div>
                  <p>
                    <span>
                      {fmt(w.used)} / {fmt(w.capacity)} unit
                    </span>
                    <b>{Math.round((w.used / w.capacity) * 100)}%</b>
                  </p>
                  <div className="progress-track">
                    <i
                      style={{
                        width: Math.min(100, (w.used / w.capacity) * 100) + "%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="stock-summary">
            <div>
              <span className="tiny-dot purple" />
              Reserved<strong>{fmt(data.kpi.reserved)}</strong>
            </div>
            <div>
              <span className="tiny-dot orange" />
              Karantina / rusak<strong>{fmt(data.kpi.quarantine)}</strong>
            </div>
          </div>
        </div>
      </div>
      {data.low_stock.length > 0 && (
        <div className="warning-strip">
          <AlertTriangle size={18} />
          <span>
            <strong>
              {data.low_stock.length} SKU mencapai batas stok minimum.
            </strong>{" "}
            {data.low_stock
              .slice(0, 3)
              .map((p: any) => p.sku)
              .join(" · ")}
          </span>
          {can("inventory.read") && (
            <button onClick={() => navigate("inventory")}>
              Periksa stok
              <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
function DataPage({
  name,
  filters,
  revision,
  search: globalSearch,
  can,
  onDetail,
  onEdit,
  onToast,
  onChanged,
  refs,
}: {
  name: string;
  filters: string;
  revision: number;
  search: string;
  can: (s: string) => boolean;
  onDetail: (r: Row) => void;
  onEdit: (r: Row) => void;
  onToast: (s: string) => void;
  onChanged: (s?: string) => void;
  refs: Record<string, Row[]>;
}) {
  const config = modules[name];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [direction, setDirection] = useState("desc");
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState("");
  useEffect(() => {
    setSearch(globalSearch);
    setPage(1);
  }, [globalSearch]);
  useEffect(() => {
    setPage(1);
    setSelected([]);
    setStatus("");
    setSearch(globalSearch);
  }, [name, filters]);
  const url =
    config.endpoint +
    (config.endpoint.includes("?") ? "&" : "?") +
    filters +
    `&page=${page}&search=${encodeURIComponent(search)}&sort=created_at&direction=${direction}${status ? "&status=" + status : ""}${["picking", "packing", "shipping"].includes(name) ? "&queue=" + name : ""}`;
  const { data, error, loading } = useRemote(url, revision);
  const writable =
    config.master &&
    can(
      ["users", "roles"].includes(name)
        ? "users.manage"
        : name === "settings"
          ? "settings.write"
          : name === "tariffs"
            ? "billing.write"
            : name + ".write",
    );
  const bulk = config.type === "order" && can("order.allocate");
  const exportKind = (
    {
      inventory: "inventory",
      ledger: "ledger",
      order: "orders",
      inbound: "inbound",
      charges: "charges",
      invoices: "invoices",
    } as any
  )[name];
  async function reserve() {
    setBusy(true);
    try {
      for (const id of selected)
        await api.post(`/documents/${id}/actions/reserve`, {
          idempotency_key: key(),
        });
      setSelected([]);
      onChanged("Pesanan terpilih berhasil dialokasikan.");
    } catch (e) {
      onToast(errorText(e));
      onChanged();
    } finally {
      setBusy(false);
    }
  }
  async function wave() {
    setBusy(true);
    try {
      await api.post("/waves", {
        document_ids: selected,
        assigned_to: Number(picker),
      });
      setSelected([]);
      onChanged("Wave picking dan penugasan dibuat.");
    } catch (e) {
      onToast(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function importCsv(file: File) {
    const f = new FormData();
    f.append("file", file);
    const c = new URLSearchParams(filters).get("client_id");
    const w = new URLSearchParams(filters).get("warehouse_id");
    if (!c || !w) {
      onToast("Pilih satu klien dan gudang sebelum impor CSV.");
      return;
    }
    f.append("client_id", c);
    f.append("warehouse_id", w);
    try {
      await api.post("/orders/import", f);
      onChanged("Pesanan CSV berhasil dibuat.");
    } catch (e) {
      onToast(errorText(e));
    }
  }
  return (
    <Panel>
      <div className="table-toolbar">
        <div>
          <SearchBox
            value={search}
            onChange={(s) => {
              setSearch(s);
              setPage(1);
            }}
            placeholder="Cari nama atau nomor dokumen…"
          />
          {(config.type || config.master) && (
            <select
              aria-label="Urutan data"
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value);
                setPage(1);
              }}
            >
              <option value="desc">Terbaru dahulu</option>
              <option value="asc">Terlama dahulu</option>
            </select>
          )}
          {config.type && (
            <select
              value={status}
              aria-label="Filter status"
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua status</option>
              {enums([
                "draft",
                "receiving",
                "putaway",
                "completed",
                "allocated",
                "backorder",
                "picking",
                "picked",
                "packing",
                "packed",
                "manifested",
                "dispatched",
                "partially_dispatched",
                "cancelled",
                "pending_approval",
                "pending_inbound_approval",
                "closed_difference",
                "approved",
                "counting",
                "in_transit",
              ]).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          {name === "order" && can("order.write") && (
            <label className="secondary upload-button">
              <ArrowDownToLine size={15} />
              Impor CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) importCsv(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {exportKind && can("reports.export") && (
            <>
              <a
                className="secondary"
                href={`/api/v1/exports/${exportKind}?${filters}`}
              >
                <Download size={15} />
                CSV
              </a>
              <a
                className="secondary"
                href={`/api/v1/exports/${exportKind}?format=xlsx&${filters}`}
              >
                Excel
              </a>
            </>
          )}
        </div>
      </div>
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} pesanan dipilih</span>
          {bulk && (
            <button className="secondary" disabled={busy} onClick={reserve}>
              Alokasi terpilih
            </button>
          )}
          {can("picking.assign") && (
            <>
              <select
                aria-label="Pilih picker"
                value={picker}
                onChange={(e) => setPicker(e.target.value)}
              >
                <option value="">Pilih picker…</option>
                {(refs.staff ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                className="primary"
                disabled={busy || !picker}
                onClick={wave}
              >
                Buat wave picking
              </button>
            </>
          )}
        </div>
      )}
      {error ? (
        <div className="error">{error}</div>
      ) : loading ? (
        <Busy />
      ) : !data?.data?.length ? (
        <Empty />
      ) : (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {(bulk ||
                    (can("picking.assign") && config.type === "order")) && (
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua pesanan"
                        checked={data.data.every((r: Row) =>
                          selected.includes(r.id),
                        )}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? data.data.map((r: Row) => r.id)
                              : [],
                          )
                        }
                      />
                    </th>
                  )}
                  {config.columns.map(([k, l]) => (
                    <th key={k}>{l}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.data.map((r: Row) => (
                  <tr
                    key={r.id}
                    onClick={() => (writable ? onEdit(r) : onDetail(r))}
                  >
                    {(bulk ||
                      (can("picking.assign") && config.type === "order")) && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={"Pilih " + r.number}
                          checked={selected.includes(r.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, r.id]
                                : selected.filter((x) => x !== r.id),
                            )
                          }
                        />
                      </td>
                    )}
                    {config.columns.map(([k]) => (
                      <td key={k}>
                        <Cell row={r} path={k} />
                      </td>
                    ))}
                    <td>
                      <ArrowUpRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager meta={data.meta} onPage={setPage} />
        </>
      )}
    </Panel>
  );
}
function EditForm({
  form,
  refs,
  client,
  warehouse,
  onClose,
  onSaved,
}: {
  form: { kind: string; row?: Row };
  refs: Record<string, Row[]>;
  client: string;
  warehouse: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [category, kind] = form.kind.split(":");
  const row = form.row;
  const [values, setValues] = useState<any>({
    ...row,
    client_id: row?.client_id ?? client ?? "",
    warehouse_id: row?.warehouse_id ?? warehouse ?? "",
    role_ids: row?.roles?.map((r: Row) => String(r.id)) ?? [],
    client_ids: row?.clients?.map((r: Row) => String(r.id)) ?? [],
    warehouse_ids: row?.warehouses?.map((r: Row) => String(r.id)) ?? [],
    serial_tracked: String(Number(row?.serial_tracked ?? 0)),
    unit: row?.unit ?? "pcs",
    weight: row?.weight ?? 0,
    minimum_stock: row?.minimum_stock ?? 10,
    rotation: row?.rotation ?? "FEFO",
    company_name: row?.value?.name ?? "",
    dispatch_hours: row?.value?.dispatch_hours ?? 24,
    prefix: row?.value?.prefix ?? "ALDEF",
    expiry_days: row?.value?.expiry_days ?? 30,
    priority: "normal",
    count_type: "cycle",
    direction: "add",
    period_start: localDate().slice(0, 7) + "-01",
    period_end: localDate(),
    due_date: localDate(14),
  });
  const [lines, setLines] = useState<any[]>([
    {
      product_id: "",
      quantity: 1,
      batch: "",
      serial: "",
      expiry: "",
      location_id: "",
    },
  ]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestKey] = useState(key);
  const fields: Field[] =
    category === "master"
      ? masterFields(kind, refs)
      : category === "invoice"
        ? [
            { key: "client_id", label: "Klien", options: option(refs.clients) },
            { key: "period_start", label: "Awal periode", type: "date" },
            { key: "period_end", label: "Akhir periode", type: "date" },
            { key: "due_date", label: "Jatuh tempo", type: "date" },
          ]
        : [
            {
              key: "client_id",
              label: "Klien pemilik barang",
              options: option(refs.clients),
            },
            {
              key: "warehouse_id",
              label: "Gudang",
              options: option(refs.warehouses),
            },
            ...(kind === "order"
              ? [
                  { key: "recipient", label: "Penerima" },
                  { key: "address", label: "Alamat tujuan", type: "textarea" },
                  {
                    key: "priority",
                    label: "Prioritas",
                    options: enums(["normal", "high", "urgent"]),
                  },
                ]
              : []),
            ...(kind === "inbound"
              ? [
                  {
                    key: "scheduled_at",
                    label: "Jadwal kedatangan",
                    type: "datetime-local",
                    required: false,
                  },
                ]
              : []),
            ...(kind === "transfer"
              ? [
                  {
                    key: "destination_warehouse_id",
                    label: "Gudang tujuan (opsional untuk mutasi bin)",
                    options: option(refs.warehouses),
                    required: false,
                  },
                ]
              : []),
            ...(kind === "return"
              ? [
                  {
                    key: "reference_id",
                    label: "Order referensi",
                    options: option(
                      refs.orders.filter(
                        (r) =>
                          r.client_id === Number(values.client_id) &&
                          ["dispatched", "partially_dispatched"].includes(
                            r.status,
                          ),
                      ),
                      "number",
                    ),
                  },
                ]
              : []),
            ...(kind === "count"
              ? [
                  {
                    key: "count_type",
                    label: "Jenis penghitungan",
                    options: enums(["cycle", "full"]),
                  },
                ]
              : []),
            ...(kind === "adjustment"
              ? [
                  {
                    key: "direction",
                    label: "Arah adjustment",
                    options: [
                      { value: "add", label: "Tambah" },
                      { value: "subtract", label: "Kurangi" },
                    ],
                  },
                  { key: "reason", label: "Alasan koreksi", type: "textarea" },
                ]
              : []),
          ];
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (category === "master") {
        const data: any = {};
        for (const f of fields) {
          const v = values[f.key];
          if (v !== "" && v !== undefined)
            data[f.key] = f.type === "number" ? Number(v) : v;
        }
        for (const f of ["client_id", "warehouse_id"])
          if (data[f]) data[f] = Number(data[f]);
        if (kind === "users") {
          data.role_ids = values.role_ids.map(Number);
          data.client_ids = values.client_ids.map(Number);
          data.warehouse_ids = values.warehouse_ids.map(Number);
        }
        if (kind === "products")
          data.serial_tracked = values.serial_tracked === "1";
        if (kind === "settings") {
          data.key = values.key;
          data.value =
            values.key === "company"
              ? {
                  name: values.company_name,
                  timezone: "Asia/Jakarta",
                  logo: "/aldef-logo-2026.png",
                }
              : values.key === "sla"
                ? { dispatch_hours: Number(values.dispatch_hours) }
                : values.key === "numbering"
                  ? { prefix: values.prefix }
                  : {
                      expiry_days: Number(values.expiry_days),
                      low_stock: true,
                    };
        }
        await api.request({
          method: row ? "put" : "post",
          url: "/master/" + kind + (row ? "/" + row.id : ""),
          data,
        });
      } else if (category === "invoice") {
        await api.post("/invoices", {
          client_id: Number(values.client_id),
          period_start: values.period_start,
          period_end: values.period_end,
          due_date: values.due_date,
          idempotency_key: requestKey,
        });
      } else {
        const data: any = {
          type: kind,
          client_id: Number(values.client_id),
          warehouse_id: Number(values.warehouse_id),
          priority: values.priority ?? "normal",
          meta: Object.fromEntries(
            ["recipient", "address", "reason", "direction", "count_type"]
              .filter((k) => values[k])
              .map((k) => [k, values[k]]),
          ),
          lines: lines.map((l) => ({
            product_id: Number(l.product_id),
            quantity: Number(l.quantity),
            ...(l.batch ? { batch: l.batch } : {}),
            ...(l.serial ? { serial: l.serial } : {}),
            ...(l.expiry ? { expiry: l.expiry } : {}),
            ...(l.location_id ? { location_id: Number(l.location_id) } : {}),
          })),
        };
        if (values.scheduled_at)
          data.scheduled_at = new Date(values.scheduled_at).toISOString();
        if (values.reference_id)
          data.reference_id = Number(values.reference_id);
        if (values.destination_warehouse_id)
          data.destination_warehouse_id = Number(
            values.destination_warehouse_id,
          );
        await api.post("/documents", data);
      }
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer
      title={
        row
          ? "Edit " + (row.name ?? row.key)
          : category === "master"
            ? "Tambah " + modules[kind].title
            : category === "invoice"
              ? "Buat invoice"
              : "Buat " + modules[kind].title
      }
      subtitle="Validasi dan simpan data ke workspace Anda."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <Fields fields={fields} values={values} setValues={setValues} />
        {category === "document" && (
          <div className="line-form">
            <h3>Item dokumen</h3>
            {lines.map((l, i) => (
              <div className="line-card" key={i}>
                <div className="line-card-header">
                  <strong>Item {i + 1}</strong>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Hapus baris"
                      onClick={() =>
                        setLines(lines.filter((_, idx) => idx !== i))
                      }
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <Fields
                  fields={[
                    {
                      key: "product_id",
                      label: "Produk / SKU",
                      options: refs.products
                        .filter((p) => p.client_id === Number(values.client_id))
                        .map((p) => ({
                          value: p.id,
                          label: p.sku + " · " + p.name,
                        })),
                    },
                    { key: "quantity", label: "Jumlah unit", type: "number" },
                    { key: "batch", label: "Batch", required: false },
                    { key: "serial", label: "Serial number", required: false },
                    ...(kind === "inbound"
                      ? [
                          {
                            key: "expiry",
                            label: "Kedaluwarsa",
                            type: "date",
                            required: false,
                          },
                        ]
                      : []),
                    ...(["transfer", "count", "adjustment"].includes(kind)
                      ? [
                          {
                            key: "location_id",
                            label: "Lokasi asal / lokasi hitung",
                            options: option(
                              refs.locations.filter(
                                (loc) =>
                                  loc.warehouse_id ===
                                    Number(values.warehouse_id) &&
                                  loc.type === "storage",
                              ),
                              "code",
                            ),
                          },
                        ]
                      : []),
                  ]}
                  values={l}
                  setValues={(v) =>
                    setLines(lines.map((line, idx) => (idx === i ? v : line)))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setLines([
                  ...lines,
                  {
                    product_id: "",
                    quantity: 1,
                    batch: "",
                    serial: "",
                    location_id: "",
                  },
                ])
              }
            >
              <Plus size={16} />
              Tambah item
            </button>
            {kind === "count" && (
              <div className="info-note">
                Hasil penghitungan dimasukkan setelah dokumen dibuat; nilai
                snapshot disembunyikan dari petugas hitung.
              </div>
            )}
          </div>
        )}
        {category === "invoice" && (
          <div className="info-note">
            Invoice mengambil aktivitas dalam periode yang belum pernah
            ditagihkan. Tarif dan nilai aktivitas memakai snapshot saat
            transaksi.
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="form-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Batal
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan data"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </Drawer>
  );
}
function DocumentDetail({
  document: d,
  can,
  refs,
  action,
  setAction,
  onUpdate,
  onToast,
}: {
  document: Row;
  can: (s: string) => boolean;
  refs: Record<string, Row[]>;
  action: string;
  setAction: (s: string) => void;
  onUpdate: (r: Row) => void;
  onToast: (s: string) => void;
}) {
  const available = Object.entries(actions).filter(
    ([, a]) =>
      a.types.includes(d.type) &&
      a.states.includes(d.status) &&
      can(a.permission),
  );
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      await api.post(`/documents/${d.id}/attachments`, data);
      onUpdate((await api.get("/documents/" + d.id)).data.data);
    } catch (e) {
      onToast(errorText(e));
    } finally {
      setUploading(false);
    }
  }
  return (
    <>
      <div className="document-summary">
        <Badge status={d.status} />
        <span>{d.warehouse?.name}</span>
        <a
          className="secondary"
          target="_blank"
          href={`/api/v1/documents/${d.id}/pdf`}
        >
          <Download size={15} />
          PDF / packing list
        </a>
        {d.meta?.tracking_number && (
          <a
            className="secondary"
            target="_blank"
            href={`/api/v1/documents/${d.id}/label`}
          >
            <Download size={15} />
            Label pengiriman
          </a>
        )}
      </div>
      <div className="detail-facts">
        <div>
          <span>Penerima / referensi</span>
          <strong>{d.meta?.recipient ?? d.reference_id ?? "—"}</strong>
        </div>
        <div>
          <span>Prioritas</span>
          <strong>{d.priority}</strong>
        </div>
        <div>
          <span>Resi</span>
          <strong>{d.meta?.tracking_number ?? "—"}</strong>
        </div>
        <div>
          <span>Manifest / wave</span>
          <strong>
            {d.meta?.manifest_number ?? d.meta?.wave_number ?? "—"}
          </strong>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>SKU / batch</th>
              <th>Qty</th>
              <th>Received</th>
              <th>Putaway</th>
              <th>Allocated</th>
              <th>Picked</th>
              <th>Packed</th>
              <th>Dispatch</th>
              {d.type === "count" && <th>Counted</th>}
            </tr>
          </thead>
          <tbody>
            {d.lines.map((l: Row) => (
              <tr key={l.id}>
                <td>
                  <strong>{l.product.sku}</strong>
                  <small>
                    {l.batch || "Semua batch"} {l.serial}
                  </small>
                </td>
                {[
                  "quantity",
                  "received",
                  "putaway",
                  "allocated",
                  "picked",
                  "packed",
                  "dispatched",
                ].map((k) => (
                  <td className="numeric" key={k}>
                    {fmt(l[k])}
                  </td>
                ))}
                {d.type === "count" && <td>{l.counted ?? "Belum dihitung"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="section-title">Aktivitas berikutnya</h3>
      <div className="action-grid">
        {available.map(([k, a]) => (
          <button
            className={action === k ? "primary" : "secondary"}
            key={k}
            onClick={() => setAction(k)}
          >
            {a.label}
            <ArrowUpRight size={15} />
          </button>
        ))}
      </div>
      {!available.length && (
        <div className="info-note">
          Tidak ada aksi tersedia untuk status dan permission Anda saat ini.
        </div>
      )}
      {action && (
        <ActionForm
          key={action}
          action={action}
          document={d}
          refs={refs}
          onUpdate={onUpdate}
        />
      )}
      <h3 className="section-title">Foto & lampiran</h3>
      {(d.attachments ?? []).map((a: Row) => (
        <a
          className="attachment"
          key={a.id}
          href={"/api/v1/attachments/" + a.id}
          target="_blank"
        >
          <ExternalLink size={15} />
          {a.name}
        </a>
      ))}
      {(can(d.type + ".write") ||
        can("packing.execute") ||
        can("return.inspect")) && (
        <label className="secondary upload-button">
          <Plus size={15} />
          {uploading ? "Mengunggah…" : "Unggah foto / PDF"}
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files?.[0]) upload(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {(d.shipments ?? []).length > 0 && (
        <>
          <h3 className="section-title">Histori pengiriman parsial</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Resi</th>
                  <th>Manifest</th>
                  <th>Item / jumlah</th>
                  <th>Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {d.shipments.map((s: Row) => (
                  <tr key={s.id}>
                    <td>{s.tracking_number}</td>
                    <td>{s.manifest_number}</td>
                    <td>
                      {s.items
                        .map((i: any) => i.sku + " × " + i.quantity)
                        .join(", ")}
                    </td>
                    <td>{date(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {(d.tracking ?? []).length > 0 && (
        <>
          <h3 className="section-title">Histori tracking</h3>
          <div className="timeline">
            {d.tracking.map((t: Row) => (
              <div key={t.id}>
                <span className="tiny-dot blue" />
                <div>
                  <strong>
                    {t.status} {t.simulated ? "· SIMULATOR LOKAL" : ""}
                  </strong>
                  <p>{t.description}</p>
                  <small>{date(t.created_at)} WIB</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
function ActionForm({
  action,
  document: d,
  refs,
  onUpdate,
}: {
  action: string;
  document: Row;
  refs: Record<string, Row[]>;
  onUpdate: (r: Row) => void;
}) {
  const [values, setValues] = useState<any>({
    line_id: String(d.lines[0]?.id ?? ""),
    quantity: 1,
    condition: "sellable",
    counted: 0,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requestKey] = useState(key);
  const line = d.lines.find((l: Row) => l.id === Number(values.line_id));
  const fields: Field[] = [];
  if (
    [
      "receive",
      "putaway",
      "pick",
      "short-pick",
      "pack",
      "inspect",
      "restock",
      "move",
      "count",
    ].includes(action)
  )
    fields.push({
      key: "line_id",
      label: "Item dokumen",
      options: d.lines.map((l: Row) => ({
        value: l.id,
        label: l.product.sku + " · " + l.product.name,
      })),
    });
  if (
    [
      "receive",
      "putaway",
      "pick",
      "short-pick",
      "pack",
      "inspect",
      "restock",
      "move",
    ].includes(action)
  )
    fields.push({ key: "quantity", label: "Jumlah unit", type: "number" });
  if (["receive", "pick", "pack", "inspect", "dispatch"].includes(action))
    fields.push({
      key: "scan",
      label: action === "dispatch" ? "Scan resi" : "Scan barcode / SKU",
      hint:
        action === "dispatch"
          ? d.meta?.tracking_number
          : `SKU: ${line?.product.sku ?? "—"} · Barcode: ${line?.product.barcode ?? "—"}`,
    });
  if (action === "pick")
    fields.push({
      key: "location_code",
      label: "Scan kode lokasi",
      hint:
        "Urutan lokasi alokasi: " +
        (line?.allocations ?? [])
          .map((a: Row) => a.balance?.location?.code ?? "lihat kartu stok")
          .join(", "),
    });
  if (["receive", "putaway", "inspect"].includes(action))
    fields.push({
      key: "condition",
      label: "Keputusan QC",
      options: [
        { value: "sellable", label: "Layak jual / restock" },
        { value: "quarantine", label: "Karantina" },
        { value: "damaged", label: "Rusak" },
      ],
    });
  if (["putaway", "restock", "move", "arrive"].includes(action))
    fields.push({
      key: "location_id",
      label: "Lokasi tujuan",
      options: option(
        refs.locations.filter(
          (l) =>
            l.warehouse_id ===
            (action === "arrive" ? d.destination_warehouse_id : d.warehouse_id),
        ),
        "code",
      ),
    });
  if (["short-pick", "close-receiving"].includes(action))
    fields.push({
      key: "reason",
      label: "Alasan short pick",
      type: "textarea",
    });
  if (action === "pack")
    fields.push(
      {
        key: "packaging_id",
        label: "Kemasan",
        options: option(refs.catalogs.filter((c) => c.kind === "packaging")),
      },
      { key: "actual_weight", label: "Berat aktual (kg)", type: "number" },
    );
  if (action === "manifest")
    fields.push(
      {
        key: "courier_id",
        label: "Kurir",
        options: option(refs.catalogs.filter((c) => c.kind === "courier")),
      },
      { key: "tracking_number", label: "Nomor resi manual" },
      { key: "manifest_number", label: "Nomor manifest" },
    );
  if (action === "count")
    fields.push({
      key: "counted",
      label: "Jumlah fisik yang dihitung",
      type: "number",
    });
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data: any = { idempotency_key: requestKey };
      for (const f of fields) {
        const v = values[f.key];
        data[f.key] =
          f.type === "number" || f.key.endsWith("_id") ? Number(v) : v;
      }
      onUpdate(
        (await api.post(`/documents/${d.id}/actions/${action}`, data)).data
          .data,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="action-form" onSubmit={submit}>
      <h3>{actions[action].label}</h3>
      {fields.length ? (
        <Fields fields={fields} values={values} setValues={setValues} />
      ) : (
        <p>
          {action === "approve"
            ? "Approval akan mengubah saldo stok. Pembuat dokumen tidak dapat menyetujui pengajuan sendiri."
            : action === "tracking"
              ? "Event ini berasal dari simulator lokal, bukan API kurir live."
              : "Konfirmasikan aktivitas pada dokumen ini."}
        </p>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="primary" disabled={busy}>
        {busy ? "Memproses…" : "Konfirmasi aktivitas"}
        <Check size={16} />
      </button>
    </form>
  );
}
function InvoiceDetail({
  invoice: d,
  can,
  onUpdated,
}: {
  invoice: Row;
  can: (s: string) => boolean;
  onUpdated: (r: Row) => void;
}) {
  const [values, setValues] = useState<any>({
    paid_at: localDate(),
    amount: Number(d.total) - Number(d.paid),
    reference: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestKey] = useState(key);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      onUpdated(
        (
          await api.post(`/invoices/${d.id}/payments`, {
            ...values,
            idempotency_key: requestKey,
          })
        ).data.data,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="document-summary">
        <Badge status={d.status} />
        <strong>{money(d.total)} total</strong>
        <strong>{money(Number(d.total) - Number(d.paid))} tersisa</strong>
      </div>
      <p className="muted">
        Periode {d.period_start} – {d.period_end} · Jatuh tempo {d.due_date}
      </p>
      <h3 className="section-title">Detail perhitungan</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Layanan</th>
              <th>Satuan</th>
              <th>Jumlah</th>
              <th>Tarif snapshot</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            {d.charges?.map((c: Row) => (
              <tr key={c.id}>
                <td>{c.service}</td>
                <td>{c.unit}</td>
                <td>{fmt(c.units)}</td>
                <td>{money(c.rate)}</td>
                <td>{money(c.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="section-title">Pembayaran</h3>
      {can("billing.write") && <EmailSimulator invoiceId={d.id} />}
      {d.payments?.map((p: Row) => (
        <div className="payment-row" key={p.id}>
          <strong>{p.reference}</strong>
          <span>{p.paid_at}</span>
          <b>{money(p.amount)}</b>
        </div>
      ))}
      {can("billing.write") && d.status !== "paid" && (
        <form className="action-form" onSubmit={submit}>
          <h3>Catat pembayaran manual</h3>
          <Fields
            fields={[
              {
                key: "amount",
                label: "Nilai pembayaran (IDR)",
                type: "number",
              },
              { key: "reference", label: "Referensi transfer" },
              { key: "paid_at", label: "Tanggal bayar", type: "date" },
            ]}
            values={values}
            setValues={setValues}
          />
          {error && <div className="error">{error}</div>}
          <button className="primary" disabled={busy}>
            {busy ? "Menyimpan…" : "Catat pembayaran"}
          </button>
        </form>
      )}
    </>
  );
}
function Reports({
  url,
  revision,
  filters,
  can,
}: {
  url: string;
  revision: number;
  filters: string;
  can: (s: string) => boolean;
}) {
  const { data, loading, error } = useRemote(url, revision);
  if (error) return <div className="error">{error}</div>;
  if (loading || !data) return <Busy />;
  return (
    <div className="reports-grid">
      {can("reports.export") && <QueueExports filters={filters} can={can} />}
      <Panel
        title="Inbound / outbound & SLA"
        subtitle="Berdasarkan dokumen dan ledger"
      >
        <div className="report-metrics">
          <div>
            <strong>{fmt(data.kpi.physical)}</strong>
            <span>Unit fisik</span>
          </div>
          <div>
            <strong>{fmt(data.kpi.dispatched)}</strong>
            <span>Order terkirim</span>
          </div>
          <div>
            <strong>{fmt(data.sla_warning)}</strong>
            <span>Order melewati SLA</span>
          </div>
        </div>
        {can("reports.export") && (
          <div className="export-links">
            {[
              "inventory",
              "ledger",
              "inbound",
              "orders",
              ...(can("billing.read") ? ["charges", "invoices"] : []),
            ].map((k) => (
              <a
                key={k}
                className="secondary"
                href={`/api/v1/exports/${k}?format=xlsx&${filters}`}
              >
                <Download size={14} />
                {k} · Excel
              </a>
            ))}
          </div>
        )}
      </Panel>
      <Panel
        title="Pendapatan layanan"
        subtitle="Biaya aktivitas yang tercatat"
      >
        {data.revenue.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Layanan</th>
                  <th>Unit</th>
                  <th>Nilai</th>
                </tr>
              </thead>
              <tbody>
                {data.revenue.map((r: any) => (
                  <tr key={r.service}>
                    <td>{r.service}</td>
                    <td>{fmt(r.units)}</td>
                    <td>{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Tidak ada pendapatan dalam lingkup akses ini." />
        )}
      </Panel>
      <Panel
        title="Utilisasi lokasi"
        subtitle="Unit tersimpan terhadap kapasitas"
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Lokasi</th>
                <th>Unit</th>
                <th>Kapasitas</th>
                <th>Utilisasi</th>
              </tr>
            </thead>
            <tbody>
              {data.utilization.map((r: any, i: number) => (
                <tr key={i}>
                  <td>{r.code}</td>
                  <td>{fmt(r.used)}</td>
                  <td>{fmt(r.capacity)}</td>
                  <td>{Math.round((r.used / r.capacity) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title="Stok rendah & mendekati expiry"
        subtitle={`SKU minimum serta batch dalam ${data.expiry_days} hari`}
      >
        <div className="alert-list">
          {data.low_stock.map((r: any) => (
            <div key={r.sku}>
              <AlertTriangle size={16} />
              <strong>{r.sku}</strong>
              <span>{fmt(r.available)} available</span>
            </div>
          ))}
          {data.expiring.map((r: Row) => (
            <div key={r.id}>
              <CalendarDays size={16} />
              <strong>
                {r.product.sku} / {r.batch}
              </strong>
              <span>{r.expiry}</span>
            </div>
          ))}
          {!data.low_stock.length && !data.expiring.length && (
            <Empty text="Tidak ada peringatan stok." />
          )}
        </div>
      </Panel>
      <Panel
        title="Aging persediaan"
        subtitle="Umur saldo sejak lokasi/batch pertama dibuat"
      >
        <div className="report-metrics">
          {data.aging.map((r: any) => (
            <div key={r.months}>
              <strong>{fmt(r.units)}</strong>
              <span>
                {r.months * 30}–{r.months * 30 + 29} hari
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Akurasi & produktivitas"
        subtitle="Pengambilan dan transaksi petugas"
      >
        <div className="report-metrics">
          <div>
            <strong>{fmt(data.accuracy.picked)}</strong>
            <span>Unit picked</span>
          </div>
          <div>
            <strong>{fmt(data.accuracy.short_pick)}</strong>
            <span>Dokumen short pick</span>
          </div>
        </div>
        {data.productivity.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID petugas</th>
                  <th>Aktivitas</th>
                  <th>Transaksi</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {data.productivity.map((r: any, i: number) => (
                  <tr key={i}>
                    <td>{r.user_id}</td>
                    <td>{r.event}</td>
                    <td>{r.transactions}</td>
                    <td>{fmt(r.units)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
