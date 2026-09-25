import Link from "next/link";
import { notFound } from "next/navigation";
import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { durationLabel, getT, pick, type DictKey } from "@/lib/i18n";
import { getMyBooking, invoiceNo } from "@/lib/bookings";
import { formatDay, formatIDR, formatStamp } from "@/lib/format";
import { methodLabel } from "@/lib/doku";
import { SITE } from "@/lib/site";
import { StatusBadge } from "@/components/StatusBadge";
import { PrintButton } from "@/components/PrintButton";
import { breakdownOf } from "@/components/OrderSummary";

export const metadata = { title: "Booking" };

export default async function BookingDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [{ lang, t }, { booking: b }] = await Promise.all([getT(), getMyBooking(code)]);
  if (!b) notFound();

  const title = pick(b.packages, "title", lang);
  const payment = b.payments.find((p) => p.status === "success") ?? b.payments[0];
  const p = breakdownOf(b);

  const timeline: [string, string, string][] = [[t("tl_created"), formatStamp(b.created_at, lang), "bg-ok"]];
  if (b.status === "pending") timeline.push([t("tl_awaiting"), t("not_paid_yet"), "bg-[#c99a2e]"]);
  if (b.paid_at) timeline.push([t("tl_paid"), formatStamp(b.paid_at, lang), "bg-ok"]);
  if (b.confirmed_at) timeline.push([t("tl_confirmed"), formatStamp(b.confirmed_at, lang), "bg-ok"]);
  if (b.completed_at) timeline.push([t("tl_completed"), formatStamp(b.completed_at, lang), "bg-ok"]);
  if (b.cancelled_at) timeline.push([t("tl_cancelled"), formatStamp(b.cancelled_at, lang), "bg-[#b4443a]"]);

  const wa = process.env.NEXT_PUBLIC_VENDOR_WA;
  const waLink = (msg: string) => `https://wa.me/${wa}?text=${encodeURIComponent(`${msg} ${b.booking_code} (${title}, ${formatDay(b.booking_date, "en")})`)}`;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-9 md:px-14">
      <Link href="/account" className="no-print text-sm text-muted hover:text-accent">&larr; {t("back_account")}</Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="display text-[34px] tracking-[-0.7px]">{b.booking_code}</h1>
        <StatusBadge status={b.status} label={t(`st_${b.status}` as DictKey)} />
      </div>

      <div className="mt-[26px] grid items-start gap-9 lg:grid-cols-[1fr_368px]">
        <div className="flex flex-col gap-5">
          <section className="card flex flex-col gap-5 p-[26px] sm:flex-row">
            <div className="h-[112px] w-[150px] shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#d9c3a5] to-[#b99270]">
              {b.packages.cover_image_url && <img src={b.packages.cover_image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="display text-2xl leading-[1.25]">{title}</p>
              <p className="mt-2 text-sm text-muted">{b.packages.destination} · {durationLabel(b.packages.duration_days, lang)}</p>
              <dl className="mt-4 flex flex-wrap gap-x-[26px] gap-y-3 text-sm">
                {([[t("date"), formatDay(b.booking_date, lang)], [t("travellers"), `${b.participants} ${t("people")}`], [t("pickup"), b.pickup_location]] as const).map(([k, v]) => (
                  <div key={k}><dt className="text-[12.5px] text-faint">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
                ))}
              </dl>
              {b.notes && <p className="mt-3 text-[13.5px] text-muted">{b.notes}</p>}
            </div>
          </section>

          <section className="card p-[26px]">
            <p className="text-[17px] font-bold">{t("payment_status")}</p>
            <ol className="mt-[18px] flex flex-col gap-3.5">
              {timeline.map(([label, time, dot]) => (
                <li key={label} className="flex items-start gap-3.5">
                  <span className={`mt-[5px] h-[11px] w-[11px] shrink-0 rounded-full ${dot}`} />
                  <div><p className="text-[14.5px] font-semibold">{label}</p><p className="mt-0.5 text-[13px] text-faint">{time}</p></div>
                </li>
              ))}
            </ol>
            {b.status === "pending" && (
              <Link href={`/booking/${b.booking_code}/pay`} className="btn mt-5 !rounded-xl !py-3.5">{t("pay_now")}</Link>
            )}
          </section>

          <section className="card p-[26px]">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-bold">{t("invoice")}</p>
              <PrintButton label={t("download_invoice")} />
            </div>
            <dl className="mt-[18px] flex flex-col gap-3 text-[14.5px]">
              {([
                [t("invoice_no"), invoiceNo(b)],
                [t("method"), methodLabel(payment?.method)],
                ["DOKU Request ID", payment?.doku_transaction_id.slice(0, 13) ?? "-"],
                [t("subtotal"), formatIDR(p.subtotal)],
                [t("service_fee"), formatIDR(p.fee)],
                [t("tax"), formatIDR(p.tax)],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
              ))}
              <div className="flex justify-between border-t border-hair pt-3"><dt className="font-bold">{t("total")}</dt><dd className="font-bold text-accent-text">{formatIDR(p.total)}</dd></div>
            </dl>
          </section>
        </div>

        <aside className="no-print card p-[26px] lg:sticky lg:top-[100px]">
          <p className="text-[17px] font-bold">{t("need_help")}</p>
          <p className="mt-2 text-sm leading-[1.6] text-muted">{t("help_desc")}</p>
          {wa && (
            <>
              <a href={waLink("Hi TeridoxTour, about booking")} target="_blank" rel="noopener"
                className="mt-[18px] flex items-center justify-center gap-2 rounded-xl bg-[#1f9d55] p-[15px] text-[15px] font-bold text-white transition hover:bg-[#178047]">
                <WhatsappLogo size={20} weight="fill" /> {t("wa_vendor")}
              </a>
              {["pending", "paid", "confirmed"].includes(b.status) && (
                <>
                  <a href={waLink("Hi TeridoxTour, I would like to reschedule booking")} target="_blank" rel="noopener" className="btn-ghost mt-2.5 w-full">{t("reschedule")}</a>
                  <a href={waLink("Hi TeridoxTour, I would like to cancel booking")} target="_blank" rel="noopener"
                    className="mt-2.5 block p-2.5 text-center text-sm text-danger hover:underline">{t("cancel_booking")}</a>
                </>
              )}
            </>
          )}
          <div className="my-5 h-px bg-hair" />
          <p className="text-[13px] leading-[1.6] text-faint">{SITE.legalName} · {SITE.address} · {SITE.phone}</p>
        </aside>
      </div>
    </div>
  );
}
