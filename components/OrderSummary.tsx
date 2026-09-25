import { formatIDR } from "@/lib/format";
import type { MyBooking } from "@/lib/bookings";
import type { T } from "@/lib/i18n";

// Amounts stored on the booking at creation; rows from before migration 0002 only have a total.
export function breakdownOf(b: MyBooking) {
  if (b.subtotal != null && b.service_fee != null && b.tax != null) {
    return { subtotal: b.subtotal, fee: b.service_fee, tax: b.tax, total: b.total_price };
  }
  return { subtotal: b.total_price, fee: 0, tax: 0, total: b.total_price };
}

export function OrderSummary({ b, title, dateLabel, t }: { b: MyBooking; title: string; dateLabel: string; t: T }) {
  const p = breakdownOf(b);
  return (
    <>
      <p className="text-[17px] font-bold">{t("order_summary")}</p>
      <p className="display mt-3.5 text-[19px] leading-[1.3]">{title}</p>
      <p className="mt-1.5 text-[13.5px] text-muted">{dateLabel} · {b.participants} {t("people")}</p>
      <div className="my-[18px] h-px bg-hair" />
      <dl className="flex flex-col gap-3 text-[14.5px]">
        {([[t("subtotal"), p.subtotal], [t("service_fee"), p.fee], [t("tax"), p.tax]] as const).map(([k, v]) => (
          <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="font-semibold">{formatIDR(v)}</dd></div>
        ))}
      </dl>
      <div className="my-[18px] h-px bg-hair" />
      <p className="flex items-baseline justify-between">
        <span className="text-[15px] font-bold">{t("total")}</span>
        <span className="text-2xl font-bold text-accent-text">{formatIDR(p.total)}</span>
      </p>
    </>
  );
}
