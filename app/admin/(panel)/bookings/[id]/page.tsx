import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT, type DictKey } from "@/lib/i18n";
import { formatDay, formatIDR, formatStamp, toWaNumber } from "@/lib/format";
import { methodLabel } from "@/lib/doku";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { updateBookingStatus } from "@/app/admin/actions";

export const metadata = { title: "Booking detail" };

type Payment = { id: string; doku_transaction_id: string; status: string; method: string | null; amount: number; created_at: string; raw_payload: unknown };

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getT();
  const { data: b } = await createAdminClient()
    .from("bookings")
    .select("*, profiles(full_name, email, phone, preferred_lang), packages(title_id), payments(*), notifications_log(channel, type, status, sent_at)")
    .eq("id", id)
    .order("created_at", { referencedTable: "payments", ascending: false })
    .maybeSingle();
  if (!b) notFound();

  const payments = b.payments as Payment[];
  const rows: [string, string][] = [
    [t("package"), b.packages.title_id],
    [t("th_date"), formatDay(b.booking_date, lang)],
    [t("travellers"), String(b.participants)],
    [t("pickup"), b.pickup_location],
    [t("notes"), b.notes ?? "-"],
    [t("th_customer"), `${b.profiles.full_name} (${b.profiles.preferred_lang.toUpperCase()})`],
    [t("email"), b.profiles.email],
    [t("phone"), b.profiles.phone],
    [t("total"), formatIDR(b.total_price)],
  ];
  const action = (value: string, label: string, cls: string) => (
    <form action={updateBookingStatus}>
      <input type="hidden" name="id" value={b.id} />
      <input type="hidden" name="action" value={value} />
      <SubmitButton className={cls}>{label}</SubmitButton>
    </form>
  );

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bookings" className="text-[13.5px] text-admin-muted hover:text-accent">&larr; {t("manage_bookings")}</Link>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{b.booking_code}</h1>
        <StatusBadge status={b.status} label={t(`st_${b.status}` as DictKey)} />
      </div>
      {b.status === "cancelled" && payments.some((p) => p.status === "success") && (
        <p role="alert" className="mt-4 rounded-[10px] bg-danger-soft p-3 text-sm text-danger">{t("refund_warning")}</p>
      )}

      <dl className="mt-6 grid gap-3 rounded-[14px] border border-admin-line bg-surface p-6 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[130px_1fr] gap-4"><dt className="text-admin-muted">{k}</dt><dd className="break-words">{v}</dd></div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {b.status === "paid" && action("confirm", t("approve"), "rounded-[10px] bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover")}
        {b.status === "confirmed" && action("complete", t("complete"), "rounded-[10px] bg-console px-5 py-3 text-sm font-semibold text-white")}
        {["pending", "paid", "confirmed"].includes(b.status) &&
          action("reject", t("reject"), "rounded-[10px] border border-admin-line bg-surface px-5 py-3 text-sm font-semibold text-[#b4443a]")}
        <a href={`https://wa.me/${toWaNumber(b.profiles.phone)}`} target="_blank" rel="noopener"
          className="flex items-center gap-1.5 rounded-[10px] border border-admin-line bg-surface px-5 py-3 text-sm font-semibold">
          <WhatsappLogo size={18} /> WhatsApp
        </a>
      </div>
      {["paid", "confirmed"].includes(b.status) && <p className="mt-2 text-xs text-admin-muted">{t("reject_note")}</p>}

      <h2 className="mb-3 mt-10 text-lg font-bold">{t("doku_tx")}</h2>
      {payments.length === 0 ? <p className="text-sm text-admin-muted">-</p> : (
        <div className="grid gap-3">
          {payments.map((p) => (
            <details key={p.id} className="rounded-[14px] border border-admin-line bg-surface p-4 text-sm">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                <StatusBadge status={p.status} label={t(`ps_${p.status}` as DictKey)} />
                <span className="tabular-nums">{formatIDR(p.amount)}</span>
                <span className="text-admin-muted">{methodLabel(p.method)}</span>
                <span className="text-admin-muted">{formatStamp(p.created_at, lang)}</span>
              </summary>
              <p className="mt-3 text-xs text-admin-muted">Request-Id: {p.doku_transaction_id}</p>
              {p.raw_payload != null && (
                <pre className="mt-2 max-h-80 overflow-auto rounded-[10px] bg-admin-bg p-3 text-xs">{JSON.stringify(p.raw_payload, null, 2)}</pre>
              )}
            </details>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-lg font-bold">{t("notif_log")}</h2>
      {b.notifications_log.length === 0 ? <p className="text-sm text-admin-muted">-</p> : (
        <ul className="grid gap-1 text-sm">
          {b.notifications_log.map((n: { channel: string; type: string; status: string; sent_at: string }, i: number) => (
            <li key={i} className="text-admin-muted">
              <span className="font-medium text-ink">{n.channel}</span> {n.type}: {n.status} ({formatStamp(n.sent_at, lang)})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
