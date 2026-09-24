import type { Lang } from "@/lib/i18n";

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Dates are stored as plain YYYY-MM-DD; format in UTC so the day never shifts.
export const formatDate = (d: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", {
    weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(d.slice(0, 10) + "T00:00:00Z"));

// Today in the vendor's timezone (WITA), as YYYY-MM-DD.
export const todayWITA = (offsetDays = 0) =>
  new Date(Date.now() + 8 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);

// ponytail: local = Indonesian phone number; add profiles.country if that proves too rough
export const isLocalPhone = (phone: string) => /^(\+?62|0)/.test(phone.replace(/[\s-]/g, ""));

export const toWaNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? "62" + d.slice(1) : d;
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu bayar", paid: "Dibayar", confirmed: "Dikonfirmasi", cancelled: "Dibatalkan", completed: "Selesai",
};
