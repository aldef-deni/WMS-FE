import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Download, RefreshCw, Plug, CheckCircle2 } from "lucide-react";
import { api, key, errorText, date } from "./api";
import type { Row } from "./api";
import { Panel, Fields, Badge, Empty } from "./components";
import { option } from "./modules";
export function Integrations({
  refs,
  can,
}: {
  refs: Record<string, Row[]>;
  can: (p: string) => boolean;
}) {
  const [values, setValues] = useState<any>({ quantity: 1 });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestKey, setRequestKey] = useState(key);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api.post("/integrations/marketplace", {
        client_id: Number(values.client_id),
        warehouse_id: Number(values.warehouse_id),
        product_id: Number(values.product_id),
        quantity: Number(values.quantity),
        idempotency_key: requestKey,
      });
      setMessage("Pesanan simulator dibuat: " + response.data.data.number);
      setRequestKey(key());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reports-grid">
      <Panel title="Adapter integrasi" subtitle="Mode lokal aktif">
        <div className="integration-cards">
          {[
            ["Marketplace", "Pesanan demo melalui adapter lokal."],
            ["Kurir", "Resi manual, manifest, dan event tracking simulasi."],
            ["Email", "Pesan dicatat di log server lokal."],
          ].map(([name, description]) => (
            <div key={name}>
              <Plug size={20} />
              <div>
                <strong>{name}</strong>
                <p>{description}</p>
              </div>
              <Badge status="Simulator lokal" />
            </div>
          ))}
        </div>
        <div className="info-note">
          Semua adapter pada halaman ini menggunakan simulator lokal. Kredensial
          dan API layanan eksternal belum dikonfigurasi.
        </div>
      </Panel>
      <Panel
        title="Simulasi order marketplace"
        subtitle="Membuat dokumen order nyata pada database lokal"
      >
        {can("order.write") ? (
          <form className="extras-form" onSubmit={submit}>
            <Fields
              fields={[
                {
                  key: "client_id",
                  label: "Klien",
                  options: option(refs.clients),
                },
                {
                  key: "warehouse_id",
                  label: "Gudang",
                  options: option(refs.warehouses),
                },
                {
                  key: "product_id",
                  label: "Produk",
                  options: option(
                    refs.products.filter(
                      (p) => p.client_id === Number(values.client_id),
                    ),
                  ),
                },
                { key: "quantity", label: "Jumlah unit", type: "number" },
              ]}
              values={values}
              setValues={setValues}
            />
            {error && <div className="error">{error}</div>}
            {message && <div className="info-note">{message}</div>}
            <button className="primary" disabled={busy}>
              {busy ? "Memproses…" : "Buat order simulator"}
            </button>
          </form>
        ) : (
          <Empty text="Akun Anda memiliki akses baca status integrasi." />
        )}
      </Panel>
    </div>
  );
}
export function QueueExports({
  filters,
  can,
}: {
  filters: string;
  can: (p: string) => boolean;
}) {
  const [kind, setKind] = useState("inventory");
  const [jobs, setJobs] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      setJobs((await api.get("/report-jobs")).data.data);
    } catch (e) {
      setError(errorText(e));
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const params = Object.fromEntries(new URLSearchParams(filters));
      await api.post("/report-jobs", { kind, ...params });
      await refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="Ekspor lengkap melalui antrean"
      subtitle="CSV diproses per 500 baris dan hanya dapat diunduh pemohon."
      action={
        <button
          className="icon-button"
          aria-label="Perbarui antrean ekspor"
          onClick={refresh}
        >
          <RefreshCw size={16} />
        </button>
      }
    >
      <div className="export-queue-controls">
        <select
          aria-label="Jenis ekspor"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {[
            "inventory",
            "ledger",
            "inbound",
            "orders",
            ...(can("billing.read") ? ["charges", "invoices"] : []),
          ].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button className="primary" disabled={busy} onClick={submit}>
          <Download size={15} />
          {busy ? "Mengantrekan…" : "Antrekan CSV lengkap"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Laporan</th>
              <th>Status</th>
              <th>Baris</th>
              <th>Dibuat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.kind}</td>
                <td>
                  <Badge status={job.status} />
                </td>
                <td>{job.rows}</td>
                <td>{date(job.created_at)}</td>
                <td>
                  {job.status === "completed" && (
                    <a
                      className="text-button"
                      href={`/api/v1/report-jobs/${job.id}/download`}
                    >
                      <Download size={14} />
                      Unduh
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!jobs.length && (
        <div className="info-note">
          Belum ada ekspor yang Anda ajukan. Tekan refresh untuk melihat hasil
          antrean.
        </div>
      )}
    </Panel>
  );
}
export function EmailSimulator({ invoiceId }: { invoiceId: number }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        className="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            setMessage(
              (
                await api.post("/integrations/email", {
                  invoice_id: invoiceId,
                  idempotency_key: key(),
                })
              ).data.message,
            );
          } catch (e) {
            setMessage(errorText(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <CheckCircle2 size={15} />
        {busy ? "Memproses…" : "Simulasi email invoice (log lokal)"}
      </button>
      {message && <div className="info-note">{message}</div>}
    </>
  );
}
