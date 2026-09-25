import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getT, pick } from "@/lib/i18n";
import { getMyBooking } from "@/lib/bookings";
import { formatDay } from "@/lib/format";
import { PaymentForm } from "@/components/PaymentForm";
import { OrderSummary } from "@/components/OrderSummary";
import { Stepper } from "@/components/Stepper";
import { payBooking } from "../../../book/actions";

export const metadata = { title: "Payment" };

export default async function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [{ lang, t }, { booking: b }] = await Promise.all([getT(), getMyBooking(code)]);
  if (!b) notFound();
  if (b.status !== "pending") redirect(`/booking/${code}`);

  const keys = ["choose_payment", "secure_payment", "pay_card", "pay_card_desc", "pay_va", "pay_va_desc", "pay_ewallet", "pay_ewallet_desc",
    "pay_qris", "pay_qris_desc", "choose_bank", "choose_wallet", "card_note", "va_note", "wallet_note", "qris_note", "pay_now"] as const;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-[72px] pt-9 md:px-14">
      <Stepper step={2} labels={[t("step_details"), t("step_payment"), t("step_done")]} />
      <h1 className="display mt-3.5 text-[36px] tracking-[-0.8px]">{t("payment_title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("booking_code")}: <span className="font-semibold text-ink">{b.booking_code}</span>. {t("pending_note")}</p>
      <PaymentForm action={payBooking} code={b.booking_code}
        s={Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<(typeof keys)[number], string>}
        summary={
          <>
            <OrderSummary b={b} title={pick(b.packages, "title", lang)} dateLabel={formatDay(b.booking_date, lang)} t={t} />
            <Link href="/account" className="mt-3.5 block text-center text-[13.5px] text-muted hover:text-accent">&larr; {t("back_booking")}</Link>
          </>
        } />
    </div>
  );
}
