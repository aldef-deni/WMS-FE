import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ClipboardCheck,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  ScanSearch,
  Truck,
  X,
} from "lucide-react";
import { api, errorText, date, fmt } from "./api";
import type { Row } from "./api";
import { Badge, Busy, Empty, Panel } from "./components";

const RECENT_KEY = "aldef.trace.recent";
const PAGE = 20;

const eventLabels: Record<string, string> = {
  receiving: "Diterima di gudang",
  putaway_out: "Putaway · keluar dari area penerimaan",
  putaway_in: "Putaway · masuk lokasi simpan",
  reserve: "Direservasi untuk pesanan",
  pick_out: "Picking · diambil dari lokasi",
  pick_in: "Picking · masuk area staging",
  dispatch: "Diserahkan ke kurir",
  short_pick_release: "Reservasi dilepas (short pick)",
  cancel_release: "Reservasi dilepas (pesanan batal)",
  return_picked_out: "Batal setelah picking · keluar staging",
  return_picked_in: "Batal setelah picking · kembali ke lokasi",
  return_sellable: "Retur diterima · layak jual",
  return_quarantine: "Retur diterima · karantina",
  return_damaged: "Retur diterima · rusak",
  return_restock_out: "Restock retur · keluar area retur",
  return_restock_in: "Restock retur · masuk lokasi simpan",
  move_out: "Mutasi bin · keluar",
  move_in: "Mutasi bin · masuk",
  transfer_send: "Transfer antargudang dikirim",
  transfer_in_transit: "Dalam perjalanan antargudang",
  transfer_arrive_out: "Transfer tiba · keluar transit",
  transfer_arrive_in: "Transfer diterima gudang tujuan",
  approved_adjustment: "Adjustment stok disetujui",
};
export const eventLabel = (e: string) =>
  eventLabels[e] ?? e.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const docTypes: Record<string, string> = {
  inbound: "Inbound",
  order: "Pesanan",
  transfer: "Transfer",
  return: "Retur",
  count: "Stock opname",
  adjustment: "Adjustment",
};
const matchLabels: Record<string, string> = {
  serial: "Serial number",
  batch: "Batch / lot",
  product: "SKU / barcode",
};

function eventIcon(e: Row) {
  if (e.event === "dispatch") return Truck;
  if (e.event === "receiving") return ArrowDownToLine;
  if (e.event.startsWith("return_")) return RotateCcw;
  if (e.event.startsWith("transfer_") || e.event.startsWith("move_"))
    return ArrowLeftRight;
  if (e.event === "approved_adjustment") return ClipboardCheck;
  if (e.quantity_delta === 0) return PackageCheck;
  return e.quantity_delta > 0 ? ArrowDownToLine : ArrowUpFromLine;
}

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

export default function Trace({
  filters,
  onOpenDocument,
}: {
  filters: string;
  onOpenDocument: (doc: Row) => void;
}) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("");
  const [data, setData] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [showEmpty, setShowEmpty] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) return;
    let active = true;
    const params = new URLSearchParams(filters);
    params.set("q", query);
    if (product) params.set("product_id", product);
    setLoading(true);
    setError("");
    setVisible(PAGE);
    api
      .get("/trace?" + params.toString())
      .then((r) => active && setData(r.data.data))
      .catch((e) => active && setError(errorText(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query, product, filters]);

  function search(term: string) {
    const q = term.trim();
    if (q.length < 2) {
      setError("Masukkan minimal 2 karakter.");
      return;
    }
    setInput(q);
    setProduct("");
    setQuery(q);
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(next);
    saveRecent(next);
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    search(input);
    field.current?.select();
  }

  const positions: Row[] = (data?.positions ?? []).filter(
    (p: Row) => showEmpty || p.quantity > 0 || p.reserved > 0,
  );
  const hidden = (data?.positions?.length ?? 0) - positions.length;
  const s = data?.summary;

  return (
    <div className="trace">
      <Panel className="trace-search">
        <form onSubmit={submit}>
          <ScanSearch size={22} />
          <input
            ref={field}
            autoFocus
            aria-label="Kode yang dilacak"
            placeholder="Scan atau ketik serial number, batch/lot, SKU, atau barcode…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={100}
          />
          <button className="primary" disabled={loading}>
            {loading ? "Melacak…" : "Lacak"}
          </button>
        </form>
        {recent.length > 0 && (
          <div className="trace-recent">
            <span>Terakhir dicari:</span>
            {recent.map((r) => (
              <button key={r} type="button" onClick={() => search(r)}>
                {r}
              </button>
            ))}
            <button
              type="button"
              className="trace-clear"
              aria-label="Hapus riwayat pencarian"
              onClick={() => {
                setRecent([]);
                saveRecent([]);
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </Panel>

      {!query && !error && (
        <Panel>
          <div className="trace-intro">
            <ScanSearch size={34} />
            <h3>Telusuri riwayat barang</h3>
            <p>
              Masukkan <strong>serial number</strong> atau{" "}
              <strong>batch/lot</strong> untuk melihat kapan barang diterima, di
              lokasi mana disimpan, dipindahkan ke mana, dan dikirim ke
              pelanggan mana beserta nomor resinya. Masukkan{" "}
              <strong>SKU atau barcode</strong> untuk melihat seluruh batch
              produk tersebut.
            </p>
          </div>
        </Panel>
      )}

      {loading && !data && <Busy />}

      {data && data.query === query && (
        <>
          <div className="trace-heading">
            <div>
              <span className="eyebrow">HASIL PELACAKAN</span>
              <h2>{data.query}</h2>
            </div>
            <div className="trace-match">
              {data.matched_by.length ? (
                data.matched_by.map((m: string) => (
                  <span key={m}>Cocok dengan {matchLabels[m] ?? m}</span>
                ))
              ) : (
                <span className="none">Tidak ditemukan</span>
              )}
            </div>
          </div>

          {data.products.length > 1 && (
            <div className="trace-products" role="group" aria-label="Produk">
              <button
                className={product === "" ? "active" : ""}
                onClick={() => setProduct("")}
              >
                Semua produk ({data.products.length})
              </button>
              {data.products.map((p: Row) => (
                <button
                  key={p.id}
                  className={product === String(p.id) ? "active" : ""}
                  onClick={() => setProduct(String(p.id))}
                >
                  <span className="mono">{p.sku}</span> {p.name}
                </button>
              ))}
            </div>
          )}

          {!data.matched_by.length && !data.documents.length ? (
            <Panel>
              <Empty
                text={`Tidak ada barang dengan serial, batch, SKU, atau barcode "${data.query}" pada lingkup akses Anda. Pastikan kode ditulis lengkap.`}
              />
            </Panel>
          ) : (
            <>
              <div className="trace-kpis">
                {[
                  ["Diterima", s.received, ArrowDownToLine],
                  ["Stok di gudang", s.on_hand, Package],
                  ["Reserved", s.reserved, PackageCheck],
                  ["Terkirim", s.dispatched, Truck],
                  ["Retur", s.returned, RotateCcw],
                  ["Lokasi aktif", s.locations, MapPin],
                ].map(([label, value, Icon]: any) => (
                  <div key={label}>
                    <Icon size={16} />
                    <span>{label}</span>
                    <strong>{fmt(value)}</strong>
                  </div>
                ))}
              </div>

              <div className="trace-grid">
                <Panel
                  title="Riwayat pergerakan"
                  subtitle={
                    data.timeline_total > data.timeline.length
                      ? `${fmt(data.timeline.length)} dari ${fmt(data.timeline_total)} pergerakan terbaru`
                      : `${fmt(data.timeline_total)} pergerakan · terbaru di atas`
                  }
                >
                  {data.timeline.length ? (
                    <ol className="trace-timeline">
                      {data.timeline.slice(0, visible).map((e: Row) => {
                        const I = eventIcon(e);
                        const tone =
                          e.quantity_delta > 0
                            ? "in"
                            : e.quantity_delta < 0
                              ? "out"
                              : "hold";
                        return (
                          <li key={e.id} className={tone}>
                            <span className="trace-dot">
                              <I size={14} />
                            </span>
                            <div>
                              <div className="trace-row">
                                <strong>{eventLabel(e.event)}</strong>
                                <span className={`trace-qty ${tone}`}>
                                  {e.quantity_delta !== 0
                                    ? `${e.quantity_delta > 0 ? "+" : ""}${fmt(e.quantity_delta)}`
                                    : `${e.reserved_delta > 0 ? "+" : ""}${fmt(e.reserved_delta)} rsv`}
                                </span>
                              </div>
                              <p>
                                <span className="mono">{e.sku}</span>
                                {e.batch && <> · Batch {e.batch}</>}
                                {e.serial && <> · SN {e.serial}</>}
                                {" · "}
                                {e.location} · {e.warehouse}
                              </p>
                              <p className="trace-meta">
                                {date(e.created_at)}
                                {e.user && <> · {e.user}</>}
                                {e.document && (
                                  <>
                                    {" · "}
                                    <button
                                      className="link"
                                      onClick={() => onOpenDocument(e.document)}
                                    >
                                      {e.document.number}
                                    </button>
                                  </>
                                )}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <Empty text="Belum ada pergerakan stok tercatat." />
                  )}
                  {data.timeline.length > visible && (
                    <div className="trace-more">
                      <button
                        className="secondary"
                        onClick={() => setVisible(visible + PAGE * 2)}
                      >
                        Tampilkan lebih banyak (
                        {fmt(data.timeline.length - visible)} lagi)
                      </button>
                    </div>
                  )}
                </Panel>

                <div className="trace-side">
                  <Panel
                    title="Posisi stok saat ini"
                    subtitle="Lokasi, batch/serial, dan kondisi"
                    action={
                      hidden > 0 || showEmpty ? (
                        <button
                          className="link"
                          onClick={() => setShowEmpty(!showEmpty)}
                        >
                          {showEmpty
                            ? "Sembunyikan saldo kosong"
                            : `Tampilkan ${hidden} saldo kosong`}
                        </button>
                      ) : undefined
                    }
                  >
                    {positions.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Lokasi</th>
                              <th>SKU / batch</th>
                              <th>Kondisi</th>
                              <th className="numeric">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {positions.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <strong className="mono">{p.location}</strong>
                                  <small className="block muted">
                                    {p.warehouse}
                                  </small>
                                </td>
                                <td>
                                  <span className="mono">{p.product.sku}</span>
                                  <small className="block muted">
                                    {[
                                      p.batch && `Batch ${p.batch}`,
                                      p.serial && `SN ${p.serial}`,
                                      p.expiry && `Exp ${p.expiry}`,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ") || "Tanpa batch"}
                                  </small>
                                </td>
                                <td>
                                  <Badge status={p.condition} />
                                </td>
                                <td className="numeric">
                                  {fmt(p.quantity)}
                                  {p.reserved > 0 && (
                                    <small className="block muted">
                                      {fmt(p.reserved)} rsv
                                    </small>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text="Tidak ada stok tersisa di gudang." />
                    )}
                  </Panel>

                  <Panel
                    title="Dokumen terkait"
                    subtitle="Penerimaan, pesanan pelanggan, transfer, dan retur"
                    className="trace-gap"
                  >
                    {data.documents.length ? (
                      <ul className="trace-docs">
                        {data.documents.map((d: Row) => (
                          <li key={d.id}>
                            <div className="trace-row">
                              <span>
                                <em>{docTypes[d.type] ?? d.type}</em>
                                <button
                                  className="link mono"
                                  onClick={() => onOpenDocument(d)}
                                >
                                  {d.number}
                                </button>
                              </span>
                              <Badge status={d.status} />
                            </div>
                            {d.type === "order" ? (
                              <>
                                <p>
                                  <strong>{d.recipient ?? "Penerima —"}</strong>
                                  {d.address && <> · {d.address}</>}
                                </p>
                                <p className="trace-meta">
                                  {d.tracking_number ? (
                                    <>
                                      {d.courier ?? "Kurir"} · Resi{" "}
                                      <span className="mono">
                                        {d.tracking_number}
                                      </span>
                                    </>
                                  ) : (
                                    "Belum ada resi"
                                  )}
                                  {" · "}
                                  {fmt(d.dispatched)} dari {fmt(d.quantity)}{" "}
                                  unit terkirim
                                  {d.dispatched_at && (
                                    <> · {date(d.dispatched_at)}</>
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="trace-meta">
                                {d.warehouse} · {fmt(d.quantity)} unit
                                {d.type === "inbound" && (
                                  <> · {fmt(d.received)} diterima</>
                                )}{" "}
                                · {date(d.created_at)}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty text="Belum ada dokumen terkait." />
                    )}
                  </Panel>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
