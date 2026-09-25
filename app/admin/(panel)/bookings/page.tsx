import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT, type DictKey } from "@/lib/i18n";
import { formatDay } from "@/lib/format";
import { methodLabel } from "@/lib/doku";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { updateBookingStatus } from "@/app/admin/actions";

export const metadata = { title: "Bookings" };

const TABS = ["all", "pending", "paid", "confirmed", "cancelled", "completed"] as const;
const COLS = "md:grid-cols-[1fr_1.6fr_1fr_.6fr_1.2fr_1fr_1.3fr]";

type Row = {
  id: string; booking_code: string; booking_date: string; participants: number; status: string;
  profiles: { full_name: string }; packages: { title_id: string };
  payments: { method: string | null; doku_transaction_id: string; status: string }[];
};

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: raw } = await searchParams;
  const status = (TABS as readonly string[]).includes(raw ?? "") ? raw! : "all";
  const { lang, t } = await getT();
  const db = createAdminClient();

  // ponytail: last 300 bookings, counts from that window; add pagination when volume grows
  const { data } = await db
    .from("bookings")
    .select("id, booking_code, booking_date, participants, status, profiles(full_name), packages(title_id), payments(method, doku_transaction_id, status)")
    .order("created_at", { ascending: false })
    .limit(300);
  const all = (data ?? []) as unknown as Row[];
  const rows = status === "all" ? all : all.filter((b) => b.status === status);
  const btn = "rounded-lg border border-admin-line px-2.5 py-1.5 text-[13px] font-semibold transition hover:bg-admin-bg";

  const action = (id: string, value: string, label: string, color: string) => (
    <form action={updateBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={value} />
      <SubmitButton className={`${btn} ${color}`}>{label}</SubmitButton>
    </form>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("manage_bookings")}</h1>
      <p className="mt-1 text-sm text-admin-muted">{t("manage_bookings_sub")}</p>
      <nav className="mt-[22px] flex flex-wrap gap-2">
        {TABS.map((s) => (
          <Link key={s} href={s === "all" ? "?" : `?status=${s}`}
            className={`rounded-full border px-4 py-[9px] text-[13.5px] font-semibold ${status === s ? "border-accent bg-accent text-white" : "border-admin-line bg-surface text-[#4a5460]"}`}>
            {s === "all" ? t("f_all") : t(`st_${s}` as DictKey)} <span className="opacity-60">{s === "all" ? all.length : all.filter((b) => b.status === s).length}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-[18px] overflow-hidden rounded-[14px] border border-admin-line bg-surface">
        <div className={`hidden border-b border-admin-line bg-[#fafbfc] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.05em] text-admin-muted md:grid ${COLS}`}>
          <span>{t("th_code")}</span><span>{t("th_customer")}</span><span>{t("th_date")}</span><span>{t("th_pax")}</span>
          <span>{t("th_payment")}</span><span>{t("th_status")}</span><span className="text-right">{t("th_action")}</span>
        </div>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-admin-muted">{t("no_admin_bookings")}</p>}
        {rows.map((b) => {
          const pay = b.payments.find((p) => p.status === "success") ?? b.payments[0];
          return (
            <div key={b.id} className={`grid items-center gap-2 border-b border-[#eff1f4] px-5 py-[15px] text-sm last:border-0 ${COLS}`}>
              <Link href={`/admin/bookings/${b.id}`} className="text-[13px] font-semibold text-accent">{b.booking_code}</Link>
              <div className="min-w-0"><p className="truncate font-semibold">{b.profiles.full_name}</p><p className="mt-0.5 truncate text-xs text-[#8a929c]">{b.packages.title_id}</p></div>
              <span className="text-[#4a5460]">{formatDay(b.booking_date, lang)}</span>
              <span className="text-[#4a5460]">{b.participants}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">{methodLabel(pay?.method)}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-[#8a929c]">{pay?.doku_transaction_id.slice(0, 13) ?? "-"}</p>
              </div>
              <span><StatusBadge status={b.status} label={t(`st_${b.status}` as DictKey)} /></span>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {b.status === "paid" && action(b.id, "confirm", t("approve"), "text-[#1f6b47]")}
                {b.status === "confirmed" && action(b.id, "complete", t("complete"), "text-[#4a5460]")}
                {["pending", "paid", "confirmed"].includes(b.status) && action(b.id, "reject", t("reject"), "text-[#b4443a]")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
