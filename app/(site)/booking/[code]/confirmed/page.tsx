import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, HourglassMedium } from "@phosphor-icons/react/dist/ssr";
import { getT, pick, type DictKey } from "@/lib/i18n";
import { getMyBooking } from "@/lib/bookings";
import { formatDay, formatIDR } from "@/lib/format";
import { methodLabel } from "@/lib/doku";
import { Stepper } from "@/components/Stepper";

export const metadata = { title: "Confirmation" };

// DOKU sends the customer back here after checkout (callback_url).
export default async function ConfirmedPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [{ lang, t }, { booking: b, profile }] = await Promise.all([getT(), getMyBooking(code)]);
  if (!b) notFound();
  if (b.status === "cancelled") redirect(`/booking/${code}`);
  const paid = b.status !== "pending";
  const payment = b.payments.find((p) => p.status === "success") ?? b.payments[0];

  const facts: [string, string, boolean?][] = [
    [t("package"), pick(b.packages, "title", lang)],
    [t("date"), formatDay(b.booking_date, lang)],
    [t("travellers"), `${b.participants} ${t("people")}`],
    [t("method"), methodLabel(payment?.method)],
    [t("pickup"), b.pickup_location],
    [t("total"), formatIDR(b.total_price), true],
  ];

  return (
    <div className="flex justify-center px-4 pb-[90px] pt-9">
      <div className="w-full max-w-[620px]">
        <div className="flex justify-center"><Stepper step={3} labels={[t("step_details"), t("step_payment"), t("step_done")]} /></div>
        <div className="mt-10 text-center">
          <span className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full ${paid ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>
            {paid ? <Check size={32} weight="bold" /> : <HourglassMedium size={32} />}
          </span>
          <h1 className="display mt-[22px] text-[38px] tracking-[-0.8px]">{paid ? t("confirm_title") : t("processing_title")}</h1>
          <p className="mt-2.5 text-[15.5px] leading-[1.6] text-muted">{paid ? t("confirm_sub") : t("processing_sub")}</p>
        </div>

        <div className="mt-[30px] rounded-[22px] border border-line bg-surface p-[30px]">
          <div className="flex items-center justify-between border-b border-dashed border-line-2 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-faint">{t("booking_code")}</p>
              <p className="display mt-1 text-[28px] tracking-[1px]">{b.booking_code}</p>
            </div>
            <span className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold ${paid ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>
              {t(`st_${b.status}` as DictKey)}
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-5 text-[14.5px]">
            {facts.map(([k, v, strong]) => (
              <div key={k}><dt className="text-[13px] text-faint">{k}</dt><dd className={`mt-0.5 break-words ${strong ? "font-bold text-accent-text" : "font-semibold"}`}>{v}</dd></div>
            ))}
          </dl>
        </div>

        <div className="mt-[26px] flex flex-wrap justify-center gap-3.5">
          {paid
            ? <Link href={`/booking/${b.booking_code}`} className="btn-dark">{t("view_booking")}</Link>
            : <Link href={`/booking/${b.booking_code}/confirmed`} className="btn-dark">{t("refresh")}</Link>}
          <Link href="/" className="btn-ghost">{t("back_home")}</Link>
        </div>
        {paid && profile && <p className="mt-5 text-center text-[13.5px] text-faint">{t("email_sent", { email: profile.email })}</p>}
      </div>
    </div>
  );
}
