import type { Field } from "./components";
import type { Row } from "./api";
export const modules: Record<
  string,
  {
    title: string;
    subtitle: string;
    endpoint: string;
    permission: string;
    type?: string;
    master?: string;
    columns: [string, string][];
  }
> = {
  integrations: {
    title: "Integrasi Lokal",
    subtitle:
      "Uji adapter marketplace, kurir, dan email pada lingkungan lokal.",
    endpoint: "/integrations",
    permission: "master.read",
    columns: [],
  },
  inbound: {
    title: "Inbound & Receiving",
    subtitle: "Terima, periksa, dan tempatkan barang dengan akurat.",
    endpoint: "/documents?type=inbound",
    permission: "inbound.read",
    type: "inbound",
    columns: [
      ["number", "Nomor ASN"],
      ["client.name", "Klien"],
      ["warehouse.name", "Gudang"],
      ["status", "Status"],
      ["created_at", "Dibuat"],
    ],
  },
  inventory: {
    title: "Persediaan",
    subtitle: "Visibilitas stok hingga ke SKU, batch, dan lokasi.",
    endpoint: "/inventory",
    permission: "inventory.read",
    columns: [
      ["product.sku", "SKU"],
      ["product.name", "Produk"],
      ["client.name", "Klien"],
      ["location.code", "Lokasi"],
      ["batch", "Batch"],
      ["quantity", "Fisik"],
      ["reserved", "Reserved"],
      ["available", "Available"],
      ["condition", "Kondisi"],
    ],
  },
  ledger: {
    title: "Kartu Stok",
    subtitle:
      "Jejak setiap pergerakan dan reservasi; histori selalu tersimpan.",
    endpoint: "/ledger",
    permission: "inventory.read",
    columns: [
      ["balance.product.sku", "SKU"],
      ["balance.location.code", "Lokasi"],
      ["event", "Aktivitas"],
      ["quantity_delta", "Δ Fisik"],
      ["reserved_delta", "Δ Reserved"],
      ["quantity_after", "Saldo"],
      ["document.number", "Referensi"],
      ["created_at", "Waktu"],
    ],
  },
  order: {
    title: "Pesanan",
    subtitle: "Kelola pesanan, alokasi stok, dan pengiriman parsial.",
    endpoint: "/documents?type=order",
    permission: "order.read",
    type: "order",
    columns: [
      ["number", "Nomor pesanan"],
      ["meta.recipient", "Penerima"],
      ["client.name", "Klien"],
      ["priority", "Prioritas"],
      ["status", "Status"],
      ["created_at", "Dibuat"],
    ],
  },
  picking: {
    title: "Picking",
    subtitle: "Ambil barang berdasarkan lokasi dan validasi scan SKU.",
    endpoint: "/documents?type=order",
    permission: "picking.execute",
    type: "order",
    columns: [
      ["number", "Pesanan / tugas"],
      ["client.name", "Klien"],
      ["warehouse.name", "Gudang"],
      ["priority", "Prioritas"],
      ["status", "Progres"],
    ],
  },
  packing: {
    title: "Packing",
    subtitle: "Validasi barang, pilih kemasan, dan siapkan pengiriman.",
    endpoint: "/documents?type=order",
    permission: "packing.execute",
    type: "order",
    columns: [
      ["number", "Pesanan"],
      ["meta.recipient", "Penerima"],
      ["client.name", "Klien"],
      ["status", "Status"],
      ["meta.actual_weight", "Berat (kg)"],
    ],
  },
  shipping: {
    title: "Shipping & Manifest",
    subtitle: "Resi manual, manifest, dan serah terima kurir.",
    endpoint: "/documents?type=order",
    permission: "shipping.execute",
    type: "order",
    columns: [
      ["number", "Pesanan"],
      ["meta.courier", "Kurir"],
      ["meta.tracking_number", "Resi"],
      ["meta.manifest_number", "Manifest"],
      ["status", "Status"],
    ],
  },
  transfer: {
    title: "Mutasi & Replenishment",
    subtitle:
      "Mutasi bin serta transfer antargudang dengan pelacakan in-transit.",
    endpoint: "/documents?type=transfer",
    permission: "transfer.read",
    type: "transfer",
    columns: [
      ["number", "Nomor mutasi"],
      ["client.name", "Klien"],
      ["warehouse.name", "Gudang asal"],
      ["destination_warehouse_id", "ID tujuan"],
      ["status", "Status"],
    ],
  },
  return: {
    title: "Retur & Quality Control",
    subtitle: "Periksa retur dan putuskan restock, karantina, atau rusak.",
    endpoint: "/documents?type=return",
    permission: "return.read",
    type: "return",
    columns: [
      ["number", "Nomor retur"],
      ["client.name", "Klien"],
      ["reference_id", "ID order"],
      ["warehouse.name", "Gudang"],
      ["status", "Status"],
    ],
  },
  count: {
    title: "Stock Opname",
    subtitle: "Blind count dengan cutoff transaksi dan approval terpisah.",
    endpoint: "/documents?type=count",
    permission: "count.read",
    type: "count",
    columns: [
      ["number", "Nomor opname"],
      ["client.name", "Klien"],
      ["warehouse.name", "Gudang"],
      ["meta.count_type", "Jenis"],
      ["status", "Status"],
    ],
  },
  adjustment: {
    title: "Adjustment",
    subtitle: "Koreksi stok melalui dokumen dan persetujuan petugas lain.",
    endpoint: "/documents?type=adjustment",
    permission: "adjustment.read",
    type: "adjustment",
    columns: [
      ["number", "Nomor adjustment"],
      ["client.name", "Klien"],
      ["meta.reason", "Alasan"],
      ["meta.direction", "Arah"],
      ["status", "Status"],
    ],
  },
  invoices: {
    title: "Invoice & Pembayaran",
    subtitle: "Tagihan dari aktivitas, snapshot tarif, dan pembayaran manual.",
    endpoint: "/invoices",
    permission: "billing.read",
    columns: [
      ["number", "Invoice"],
      ["client.name", "Klien"],
      ["period_start", "Awal periode"],
      ["due_date", "Jatuh tempo"],
      ["total", "Total"],
      ["paid", "Dibayar"],
      ["status", "Status"],
    ],
  },
  charges: {
    title: "Biaya Layanan",
    subtitle:
      "Setiap aktivitas memiliki referensi unik untuk mencegah tagihan ganda.",
    endpoint: "/charges",
    permission: "billing.read",
    columns: [
      ["client.name", "Klien"],
      ["service", "Layanan"],
      ["unit", "Satuan"],
      ["units", "Jumlah"],
      ["rate", "Tarif snapshot"],
      ["amount", "Nilai"],
      ["document.number", "Dokumen"],
    ],
  },
  audit: {
    title: "Audit Log",
    subtitle: "Histori tindakan penting berdasarkan lingkup akses Anda.",
    endpoint: "/audit",
    permission: "audit.read",
    columns: [
      ["action", "Tindakan"],
      ["subject", "Referensi"],
      ["user.name", "Petugas"],
      ["created_at", "Waktu"],
    ],
  },
};
const masterColumns: Record<string, [string, string][]> = {
  clients: [
    ["code", "Kode"],
    ["name", "Nama klien"],
    ["email", "Email"],
    ["address", "Alamat"],
  ],
  warehouses: [
    ["code", "Kode"],
    ["name", "Nama gudang"],
    ["address", "Alamat"],
    ["capacity", "Kapasitas"],
  ],
  locations: [
    ["code", "Bin / rak"],
    ["zone", "Zona"],
    ["warehouse.name", "Gudang"],
    ["type", "Jenis"],
    ["capacity", "Kapasitas"],
  ],
  products: [
    ["sku", "SKU"],
    ["barcode", "Barcode"],
    ["name", "Produk"],
    ["client.name", "Klien"],
    ["variant", "Varian"],
    ["unit", "Satuan"],
    ["rotation", "Rotasi"],
  ],
  catalogs: [
    ["code", "Kode"],
    ["kind", "Kategori"],
    ["name", "Nama"],
  ],
  tariffs: [
    ["client.name", "Klien"],
    ["service", "Layanan"],
    ["unit", "Satuan"],
    ["rate", "Tarif (IDR)"],
  ],
  users: [
    ["name", "Nama"],
    ["email", "Email"],
    ["roles", "Role"],
    ["clients", "Akses klien"],
    ["warehouses", "Akses gudang"],
  ],
  roles: [
    ["name", "Role"],
    ["permissions", "Permission"],
  ],
  settings: [
    ["key", "Pengaturan"],
    ["value", "Nilai"],
  ],
};
const titles: Record<string, string> = {
  clients: "Klien",
  warehouses: "Gudang",
  locations: "Zona, Rak & Bin",
  products: "Produk & SKU",
  catalogs: "Kemasan, Kurir & Satuan",
  tariffs: "Tarif Layanan",
  users: "Pengguna & Penugasan",
  roles: "Role & Permission",
  settings: "Pengaturan Perusahaan",
};
Object.entries(masterColumns).forEach(
  ([name, columns]) =>
    (modules[name] = {
      title: titles[name],
      subtitle: "Kelola referensi operasional dan konfigurasi yang konsisten.",
      endpoint: "/master/" + name,
      permission: ["users", "roles", "settings"].includes(name)
        ? "settings.read"
        : name === "tariffs"
          ? "billing.read"
          : "master.read",
      master: name,
      columns,
    }),
);
export const option = (rows: Row[], label = "name") =>
  rows.map((r) => ({
    value: r.id,
    label: r[label] ?? r.number ?? String(r.id),
  }));
export const enums = (items: string[]) =>
  items.map((i) => ({ value: i, label: i }));
export function masterFields(
  kind: string,
  refs: Record<string, Row[]>,
): Field[] {
  const client: Field = {
    key: "client_id",
    label: "Klien",
    options: option(refs.clients),
  };
  const warehouse: Field = {
    key: "warehouse_id",
    label: "Gudang",
    options: option(refs.warehouses),
  };
  const name: Field = { key: "name", label: "Nama" };
  const code: Field = { key: "code", label: "Kode" };
  const address: Field = {
    key: "address",
    label: "Alamat",
    type: "textarea",
    required: false,
  };
  return (
    (
      {
        clients: [
          name,
          code,
          { key: "email", label: "Email", type: "email", required: false },
          address,
        ],
        warehouses: [
          name,
          code,
          address,
          { key: "capacity", label: "Kapasitas unit", type: "number" },
        ],
        locations: [
          warehouse,
          code,
          { key: "zone", label: "Zona / rak" },
          {
            key: "type",
            label: "Jenis lokasi",
            options: enums([
              "storage",
              "receiving",
              "staging",
              "quarantine",
              "damaged",
              "transit",
            ]),
          },
          { key: "capacity", label: "Kapasitas unit", type: "number" },
        ],
        products: [
          client,
          { key: "sku", label: "SKU" },
          { key: "barcode", label: "Barcode" },
          name,
          { key: "variant", label: "Varian", required: false },
          { key: "unit", label: "Satuan" },
          { key: "weight", label: "Berat (kg)", type: "number" },
          {
            key: "length",
            label: "Panjang (cm)",
            type: "number",
            required: false,
          },
          {
            key: "width",
            label: "Lebar (cm)",
            type: "number",
            required: false,
          },
          {
            key: "height",
            label: "Tinggi (cm)",
            type: "number",
            required: false,
          },
          { key: "minimum_stock", label: "Minimum stok", type: "number" },
          {
            key: "rotation",
            label: "Aturan rotasi",
            options: enums(["FIFO", "FEFO"]),
          },
          {
            key: "serial_tracked",
            label: "Pelacakan serial",
            options: [
              { value: "0", label: "Tidak" },
              { value: "1", label: "Ya" },
            ],
          },
        ],
        catalogs: [
          {
            key: "kind",
            label: "Kategori",
            options: enums(["packaging", "courier", "unit", "zone"]),
          },
          code,
          name,
        ],
        tariffs: [
          client,
          {
            key: "service",
            label: "Layanan",
            options: enums([
              "receiving",
              "storage",
              "picking",
              "packing",
              "packaging",
              "shipping",
              "return",
            ]),
          },
          {
            key: "unit",
            label: "Satuan perhitungan",
            options: enums(["unit", "package", "unit_day"]),
            hint: "Storage: unit_day; shipping/kemasan: package; lainnya: unit.",
          },
          { key: "rate", label: "Tarif rupiah", type: "number" },
        ],
        users: [
          name,
          { key: "email", label: "Email", type: "email" },
          {
            key: "password",
            label: "Password baru (minimal 12 karakter)",
            type: "password",
            required: false,
          },
          {
            key: "role_ids",
            label: "Role (dapat lebih dari satu)",
            options: option(refs.roles ?? []),
            type: "multiselect",
          },
          {
            key: "client_ids",
            label: "Penugasan klien",
            options: option(refs.clients),
            type: "multiselect",
          },
          {
            key: "warehouse_ids",
            label: "Penugasan gudang",
            options: option(refs.warehouses),
            type: "multiselect",
          },
        ],
        roles: [
          name,
          {
            key: "permissions",
            label: "Permission",
            options: (refs.permissions ?? []).map((p: any) => ({
              value: p,
              label: p,
            })),
            type: "multiselect",
          },
        ],
        settings: [
          {
            key: "key",
            label: "Jenis pengaturan",
            options: enums(["company", "sla", "numbering", "notifications"]),
          },
          { key: "company_name", label: "Nama perusahaan", required: false },
          {
            key: "dispatch_hours",
            label: "SLA dispatch (jam)",
            type: "number",
            required: false,
          },
          { key: "prefix", label: "Prefix dokumen", required: false },
          {
            key: "expiry_days",
            label: "Peringatan expiry (hari)",
            type: "number",
            required: false,
          },
        ],
      } as Record<string, Field[]>
    )[kind] ?? []
  );
}
export const actions: Record<
  string,
  { label: string; permission: string; types: string[]; states: string[] }
> = {
  "close-receiving": {
    label: "Tutup dengan selisih",
    permission: "inbound.receive",
    types: ["inbound"],
    states: ["receiving", "putaway"],
  },
  "approve-receiving": {
    label: "Setujui selisih ASN",
    permission: "inventory.approve",
    types: ["inbound"],
    states: ["pending_inbound_approval"],
  },
  receive: {
    label: "Terima & QC",
    permission: "inbound.receive",
    types: ["inbound"],
    states: ["draft", "receiving", "putaway"],
  },
  putaway: {
    label: "Putaway",
    permission: "inbound.putaway",
    types: ["inbound"],
    states: ["receiving", "putaway"],
  },
  reserve: {
    label: "Alokasi stok",
    permission: "order.allocate",
    types: ["order"],
    states: ["draft", "backorder", "allocated", "partially_dispatched"],
  },
  pick: {
    label: "Scan picking",
    permission: "picking.execute",
    types: ["order"],
    states: ["allocated", "backorder", "picking", "partially_dispatched"],
  },
  "short-pick": {
    label: "Catat short pick",
    permission: "picking.execute",
    types: ["order"],
    states: ["allocated", "backorder", "picking"],
  },
  pack: {
    label: "Scan packing",
    permission: "packing.execute",
    types: ["order"],
    states: [
      "picked",
      "picking",
      "packing",
      "backorder",
      "partially_dispatched",
    ],
  },
  manifest: {
    label: "Buat manifest",
    permission: "shipping.execute",
    types: ["order"],
    states: ["packed"],
  },
  dispatch: {
    label: "Scan serah terima",
    permission: "shipping.execute",
    types: ["order"],
    states: ["manifested"],
  },
  cancel: {
    label: "Batalkan pesanan",
    permission: "order.cancel",
    types: ["order"],
    states: [
      "draft",
      "allocated",
      "backorder",
      "picking",
      "picked",
      "packing",
      "packed",
    ],
  },
  "return-picked": {
    label: "Kembalikan dari staging",
    permission: "order.cancel",
    types: ["order"],
    states: [
      "picked",
      "picking",
      "packing",
      "packed",
      "backorder",
      "allocated",
    ],
  },
  inspect: {
    label: "Inspeksi retur",
    permission: "return.inspect",
    types: ["return"],
    states: ["draft", "inspecting"],
  },
  restock: {
    label: "Restock",
    permission: "return.inspect",
    types: ["return"],
    states: ["inspecting", "completed"],
  },
  move: {
    label: "Mutasi / replenish bin",
    permission: "inventory.move",
    types: ["transfer"],
    states: ["draft"],
  },
  send: {
    label: "Kirim antar gudang",
    permission: "inventory.move",
    types: ["transfer"],
    states: ["draft"],
  },
  arrive: {
    label: "Terima transfer",
    permission: "inventory.move",
    types: ["transfer"],
    states: ["in_transit"],
  },
  count: {
    label: "Input hitung / hitung ulang",
    permission: "inventory.count",
    types: ["count"],
    states: ["draft", "counting"],
  },
  submit: {
    label: "Ajukan approval",
    permission: "inventory.count",
    types: ["count", "adjustment"],
    states: ["draft", "counting"],
  },
  approve: {
    label: "Setujui adjustment",
    permission: "inventory.approve",
    types: ["count", "adjustment"],
    states: ["pending_approval"],
  },
  tracking: {
    label: "Tracking simulator lokal",
    permission: "shipping.execute",
    types: ["order"],
    states: ["dispatched", "partially_dispatched"],
  },
};
