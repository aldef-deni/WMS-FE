import {
  X,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Inbox,
} from "lucide-react";
import type { ReactNode } from "react";
import { fmt } from "./api";
export function Badge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: "Buat baru",
    receiving: "Receiving",
    putaway: "Putaway",
    completed: "Selesai",
    allocated: "Teralokasi",
    backorder: "Backorder",
    picking: "Picking",
    picked: "Siap packing",
    packing: "Packing",
    packed: "Siap kirim",
    manifested: "Manifest",
    dispatched: "Terkirim",
    cancelled: "Dibatalkan",
    partially_dispatched: "Kirim parsial",
    pending_approval: "Menunggu approval",
    approved: "Disetujui",
    counting: "Penghitungan",
    inspecting: "Inspeksi",
    in_transit: "Dalam perjalanan",
    sellable: "Layak jual",
    damaged: "Rusak",
    quarantine: "Karantina",
    transit: "In-transit",
    paid: "Lunas",
    unpaid: "Belum dibayar",
    partial: "Sebagian",
  };
  return (
    <span className={`badge badge-${status}`}>{labels[status] || status}</span>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Drawer({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className={`drawer ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <div>
            <span className="eyebrow">ALDEF WORKSPACE</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" aria-label="Tutup" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
export function Busy() {
  return (
    <div className="empty">
      <LoaderCircle className="spin" size={28} />
      <p>Memuat data operasional…</p>
    </div>
  );
}
export function Empty({
  text = "Belum ada data untuk filter ini.",
}: {
  text?: string;
}) {
  return (
    <div className="empty">
      <Inbox size={34} />
      <p>{text}</p>
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Cari data…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function Pager({
  meta,
  onPage,
}: {
  meta: any;
  onPage: (n: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        Menampilkan {meta.from ?? 0}–{meta.to ?? 0} dari {fmt(meta.total ?? 0)}{" "}
        data
      </span>
      <div>
        <button
          disabled={meta.current_page <= 1}
          className="icon-button"
          aria-label="Halaman sebelumnya"
          onClick={() => onPage(meta.current_page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span>
          {meta.current_page} / {meta.last_page}
        </span>
        <button
          disabled={meta.current_page >= meta.last_page}
          className="icon-button"
          aria-label="Halaman berikutnya"
          onClick={() => onPage(meta.current_page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string | number; label: string }[];
  required?: boolean;
  hint?: string;
};
export function Fields({
  fields,
  values,
  setValues,
}: {
  fields: Field[];
  values: any;
  setValues: (v: any) => void;
}) {
  return (
    <div className="form-grid">
      {fields.map((f) => (
        <label
          key={f.key}
          className={
            f.type === "textarea" || f.type === "multiselect" ? "span-2" : ""
          }
        >
          <span>
            {f.label}
            {f.required !== false && <b> *</b>}
          </span>
          {f.options ? (
            <select
              required={f.required !== false}
              multiple={f.type === "multiselect"}
              value={values[f.key] ?? (f.type === "multiselect" ? [] : "")}
              onChange={(e) =>
                setValues({
                  ...values,
                  [f.key]:
                    f.type === "multiselect"
                      ? Array.from(e.target.selectedOptions, (o) => o.value)
                      : e.target.value,
                })
              }
            >
              {f.type !== "multiselect" && (
                <option value="">Pilih {f.label.toLowerCase()}</option>
              )}
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              required={f.required !== false}
              rows={3}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.value })
              }
            />
          ) : (
            <input
              required={f.required !== false}
              type={f.type ?? "text"}
              step={f.type === "number" ? "any" : undefined}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.value })
              }
            />
          )}{" "}
          {f.hint && <small>{f.hint}</small>}
        </label>
      ))}
    </div>
  );
}
