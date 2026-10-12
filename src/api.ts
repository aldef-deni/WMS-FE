import axios from "axios";
export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});
export async function login(email: string, password: string) {
  await axios.get("/sanctum/csrf-cookie", { withCredentials: true });
  return (await api.post("/login", { email, password })).data;
}
export const errorText = (error: unknown): string =>
  axios.isAxiosError(error)
    ? Object.values(error.response?.data?.errors ?? {})
        .flat()
        .join(" · ") ||
      error.response?.data?.message ||
      "Koneksi ke server gagal."
    : error instanceof Error
      ? error.message
      : "Operasi gagal.";
export const key = () => crypto.randomUUID();
export const fmt = (n: number | string = 0) =>
  new Intl.NumberFormat("id-ID").format(Number(n));
export const money = (n: number | string = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n));
export const date = (s: string) =>
  s
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(s))
    : "—";
export type Row = { id: number; [key: string]: any };
export const localDate = (offsetDays = 0) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offsetDays * 86400000));
export type Session = {
  user: Row;
  permissions: string[];
  super_admin: boolean;
};
