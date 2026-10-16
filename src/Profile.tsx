import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  BriefcaseBusiness,
  Camera,
  Clock,
  Info,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  MonitorSmartphone,
  Phone,
  Save,
  ShieldCheck,
  Trash,
  UserRound,
} from "lucide-react";
import { api, errorText, date } from "./api";
import type { Row, Session } from "./api";
import { Busy, Empty, Panel } from "./components";

export function avatarSrc(user: Row) {
  return user.avatar_url ? `${api.defaults.baseURL}${user.avatar_url}` : null;
}

export function Avatar({
  user,
  className = "",
}: {
  user: Row;
  className?: string;
}) {
  const src = avatarSrc(user);
  return (
    <div className={`user-avatar ${className}`}>
      {src ? (
        <img src={src} alt={`Foto profil ${user.name}`} />
      ) : (
        String(user.name ?? "")
          .slice(0, 2)
          .toUpperCase()
      )}
    </div>
  );
}

const activityLabels: Record<string, string> = {
  "auth.login": "Masuk ke sistem",
  "auth.logout": "Keluar dari sistem",
  "profile.update": "Memperbarui informasi profil",
  "profile.password": "Mengganti password",
  "profile.avatar": "Mengganti foto profil",
  "profile.avatar_removed": "Menghapus foto profil",
  "profile.logout_other_sessions": "Mengakhiri sesi perangkat lain",
};
const activityText = (action: string) =>
  activityLabels[action] ??
  action.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function device(agent = "") {
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /OPR\//.test(agent)
      ? "Opera"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Firefox\//.test(agent)
          ? "Firefox"
          : /Safari\//.test(agent)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(agent)
    ? "Windows"
    : /Android/.test(agent)
      ? "Android"
      : /iPhone|iPad/.test(agent)
        ? "iOS"
        : /Mac OS/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "Perangkat lain";
  return `${browser} · ${os}`;
}

type Tab = "info" | "security" | "access" | "activity";

export default function Profile({
  session,
  onSession,
  onToast,
}: {
  session: Session;
  onSession: (s: Session) => void;
  onToast: (text: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const [meta, setMeta] = useState<Row | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const user = session.user;
  useEffect(() => {
    api
      .get("/profile")
      .then((r) => setMeta(r.data.data))
      .catch((e) => onToast(errorText(e)));
  }, [onToast]);
  const demo = !!(meta?.demo ?? session.demo);

  async function upload(f: File | undefined) {
    if (!f) return;
    setAvatarError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type))
      return setAvatarError("Format foto harus JPG, PNG, atau WEBP.");
    if (f.size > 3 * 1024 * 1024)
      return setAvatarError("Ukuran foto maksimal 3 MB.");
    const body = new FormData();
    body.append("avatar", f);
    setUploading(true);
    try {
      onSession((await api.post("/profile/avatar", body)).data);
      onToast("Foto profil diperbarui.");
    } catch (e) {
      setAvatarError(errorText(e));
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }
  async function removeAvatar() {
    setUploading(true);
    try {
      onSession((await api.delete("/profile/avatar")).data);
      onToast("Foto profil dihapus.");
    } catch (e) {
      setAvatarError(errorText(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="profile-layout">
      <section className="panel profile-card">
        <div className="profile-cover" />
        <div className="profile-photo">
          <Avatar user={user} className="xl" />
          <button
            className="profile-photo-button"
            aria-label="Ganti foto profil"
            disabled={uploading}
            onClick={() => file.current?.click()}
          >
            <Camera size={16} />
          </button>
          <input
            ref={file}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            data-testid="avatar-input"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>
        <h2>{user.name}</h2>
        <p className="profile-title">
          {user.job_title || "Jabatan belum diisi"}
        </p>
        <div className="profile-roles">
          {user.roles?.map((r: Row) => (
            <span key={r.id}>{r.name}</span>
          ))}
        </div>
        <div className="profile-photo-actions">
          <button
            className="secondary"
            disabled={uploading}
            onClick={() => file.current?.click()}
          >
            <Camera size={15} />
            {uploading
              ? "Memproses…"
              : user.avatar_url
                ? "Ganti foto"
                : "Unggah foto"}
          </button>
          {user.avatar_url && (
            <button
              className="secondary danger-text"
              disabled={uploading}
              onClick={removeAvatar}
            >
              <Trash size={15} /> Hapus
            </button>
          )}
        </div>
        <small className="profile-hint">
          JPG, PNG, atau WEBP · maks. 3 MB · dipotong persegi otomatis
        </small>
        {avatarError && (
          <div className="error" role="alert">
            {avatarError}
          </div>
        )}
        <dl className="profile-facts">
          <div>
            <dt>
              <Mail size={14} /> Email
            </dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>
              <Phone size={14} /> Telepon
            </dt>
            <dd>{user.phone || "—"}</dd>
          </div>
          <div>
            <dt>
              <Clock size={14} /> Login terakhir
            </dt>
            <dd>{user.last_login_at ? date(user.last_login_at) : "—"}</dd>
          </div>
          <div>
            <dt>
              <UserRound size={14} /> Bergabung
            </dt>
            <dd>{user.created_at ? date(user.created_at) : "—"}</dd>
          </div>
        </dl>
      </section>
      <div className="profile-main">
        {demo && (
          <div className="profile-demo-note">
            <Info size={17} />
            <span>
              Anda memakai <strong>akun demo</strong>. Email dan password tidak
              dapat diubah. Data kembali ke default 24 jam setelah login
              {meta?.demo_reset_at
                ? ` (reset berikutnya ${date(meta.demo_reset_at)})`
                : ""}
              .
            </span>
          </div>
        )}
        <div className="profile-tabs" role="tablist">
          {(
            [
              ["info", "Informasi pribadi", UserRound],
              ["security", "Keamanan", LockKeyhole],
              ["access", "Akses & penugasan", ShieldCheck],
              ["activity", "Aktivitas", Clock],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        {tab === "info" && (
          <InfoForm
            key={String(user.updated_at)}
            user={user}
            demo={demo}
            onSession={onSession}
            onToast={onToast}
          />
        )}
        {tab === "security" && (
          <Security
            demo={demo}
            supported={meta?.sessions_supported !== false}
            onToast={onToast}
          />
        )}
        {tab === "access" && <Access session={session} />}
        {tab === "activity" && <Activity />}
      </div>
    </div>
  );
}

function InfoForm({
  user,
  demo,
  onSession,
  onToast,
}: {
  user: Row;
  demo: boolean;
  onSession: (s: Session) => void;
  onToast: (text: string) => void;
}) {
  const [data, setData] = useState({
    name: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    job_title: user.job_title ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof data) => (v: string) =>
    setData((d) => ({ ...d, [k]: v }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSession((await api.put("/profile", data)).data);
      onToast("Profil berhasil diperbarui.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="Informasi pribadi"
      subtitle="Nama dan kontak yang tampil pada aktivitas dan dokumen."
    >
      <form className="profile-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            <span>
              Nama lengkap <b>*</b>
            </span>
            <input
              required
              maxLength={150}
              value={data.name}
              onChange={(e) => set("name")(e.target.value)}
            />
          </label>
          <label>
            <span>
              Email <b>*</b>
            </span>
            <input
              type="email"
              required
              disabled={demo}
              value={data.email}
              onChange={(e) => set("email")(e.target.value)}
            />
            {demo && <small>Email akun demo tidak dapat diubah.</small>}
          </label>
          <label>
            <span>
              <Phone size={12} /> Nomor telepon
            </span>
            <input
              type="tel"
              maxLength={30}
              placeholder="+62 812-0000-0000"
              value={data.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </label>
          <label>
            <span>
              <BriefcaseBusiness size={12} /> Jabatan
            </span>
            <input
              maxLength={100}
              placeholder="Contoh: Warehouse Supervisor"
              value={data.job_title}
              onChange={(e) => set("job_title")(e.target.value)}
            />
          </label>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="form-footer">
          <button className="primary" disabled={busy}>
            <Save size={16} /> {busy ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function Security({
  demo,
  supported,
  onToast,
}: {
  demo: boolean;
  supported: boolean;
  onToast: (text: string) => void;
}) {
  const empty = {
    current_password: "",
    password: "",
    password_confirmation: "",
  };
  const [data, setData] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Row[] | null>(null);
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState("");
  const [ending, setEnding] = useState(false);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => {
    if (!supported) return;
    api
      .get("/profile/sessions")
      .then((r) => setSessions(r.data.data))
      .catch(() => setSessions([]));
  }, [supported, revision]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (data.password !== data.password_confirmation)
      return setError("Konfirmasi password baru tidak sama.");
    setBusy(true);
    try {
      await api.put("/profile/password", data);
      setData(empty);
      setRevision((v) => v + 1);
      onToast("Password diganti. Sesi di perangkat lain telah diakhiri.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function endOthers(e: FormEvent) {
    e.preventDefault();
    setEnding(true);
    setSessionError("");
    try {
      const r = await api.delete("/profile/sessions", {
        data: { current_password: confirm },
      });
      setConfirm("");
      setRevision((v) => v + 1);
      onToast(`${r.data.data.ended} sesi perangkat lain diakhiri.`);
    } catch (err) {
      setSessionError(errorText(err));
    } finally {
      setEnding(false);
    }
  }
  const others = (sessions ?? []).filter((s) => !s.current).length;
  return (
    <>
      <Panel
        title="Ganti password"
        subtitle="Minimal 12 karakter. Sesi di perangkat lain otomatis diakhiri."
      >
        <form className="profile-form" onSubmit={submit}>
          <div className="form-grid">
            <label className="span-2">
              <span>
                <KeyRound size={12} /> Password saat ini
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                disabled={demo}
                value={data.current_password}
                onChange={(e) =>
                  setData({ ...data, current_password: e.target.value })
                }
              />
            </label>
            <label>
              Password baru
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                disabled={demo}
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
              />
            </label>
            <label>
              Ulangi password baru
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                disabled={demo}
                value={data.password_confirmation}
                onChange={(e) =>
                  setData({ ...data, password_confirmation: e.target.value })
                }
              />
            </label>
          </div>
          {demo && (
            <p className="profile-muted">
              Password akun demo dikunci agar tetap bisa dipakai bersama.
            </p>
          )}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="form-footer">
            <button className="primary" disabled={busy || demo}>
              <LockKeyhole size={16} /> {busy ? "Menyimpan…" : "Ganti password"}
            </button>
          </div>
        </form>
      </Panel>
      {supported && (
        <Panel
          title="Sesi aktif"
          subtitle="Perangkat yang sedang masuk dengan akun Anda."
          className="profile-gap"
        >
          {sessions === null ? (
            <Busy />
          ) : sessions.length ? (
            <ul className="profile-list">
              {sessions.map((s) => (
                <li key={s.id}>
                  <MonitorSmartphone size={18} />
                  <div>
                    <strong>
                      {device(s.user_agent)}
                      {s.current && <em>Perangkat ini</em>}
                    </strong>
                    <span>
                      {s.ip_address ?? "IP tidak diketahui"} · aktif{" "}
                      {date(s.last_activity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Tidak ada sesi tercatat." />
          )}
          {!demo && others > 0 && (
            <form className="profile-form profile-end" onSubmit={endOthers}>
              <label>
                Konfirmasi password untuk mengakhiri {others} sesi lain
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              <button className="secondary danger-text" disabled={ending}>
                <LogOut size={15} />
                {ending ? "Memproses…" : "Keluar dari perangkat lain"}
              </button>
              {sessionError && (
                <div className="error" role="alert">
                  {sessionError}
                </div>
              )}
            </form>
          )}
        </Panel>
      )}
    </>
  );
}

function Access({ session }: { session: Session }) {
  const u = session.user;
  const chips = (rows: Row[] | undefined, all: string) =>
    session.super_admin ? (
      <span className="profile-chip strong">{all}</span>
    ) : rows?.length ? (
      rows.map((r) => (
        <span className="profile-chip" key={r.id}>
          {r.name}
        </span>
      ))
    ) : (
      <span className="profile-muted">Belum ada penugasan.</span>
    );
  return (
    <Panel
      title="Akses & penugasan"
      subtitle="Diatur oleh Super Admin melalui menu Pengguna & akses."
    >
      <div className="profile-access">
        <div>
          <h4>Role</h4>
          <div>
            {u.roles?.map((r: Row) => (
              <span className="profile-chip strong" key={r.id}>
                {r.name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4>Klien</h4>
          <div>{chips(u.clients, "Semua klien")}</div>
        </div>
        <div>
          <h4>Gudang</h4>
          <div>{chips(u.warehouses, "Semua gudang")}</div>
        </div>
        <div>
          <h4>Permission ({session.permissions.length})</h4>
          <div>
            {session.permissions.map((p) => (
              <span className="profile-chip mono" key={p}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Activity() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    api
      .get("/profile/activity")
      .then((r) => setRows(r.data.data))
      .catch(() => setRows([]));
  }, []);
  return (
    <Panel
      title="Aktivitas terakhir"
      subtitle="30 aktivitas terbaru akun Anda."
    >
      {rows === null ? (
        <Busy />
      ) : rows.length ? (
        <ul className="profile-list">
          {rows.map((r) => (
            <li key={r.id}>
              <Clock size={17} />
              <div>
                <strong>{activityText(r.action)}</strong>
                <span>
                  {date(r.created_at)}
                  {!r.action.startsWith("auth.") &&
                  !r.action.startsWith("profile.")
                    ? ` · ${r.subject}`
                    : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="Belum ada aktivitas." />
      )}
    </Panel>
  );
}
