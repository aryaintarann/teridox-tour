import { notFound } from "next/navigation";
import { CheckCircle, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { getSession } from "@/lib/auth";
import { getT, pick, type DictKey } from "@/lib/i18n";
import { formatDate, formatIDR } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { payBooking } from "../../book/actions";

export const metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ payment_error?: string }>;
}) {
  const [{ code }, { payment_error }] = await Promise.all([params, searchParams]);
  const [{ lang, t }, { supabase, profile }] = await Promise.all([getT(), getSession()]);

  // RLS: customers only see their own bookings.
  const { data: b } = await supabase
    .from("bookings")
    .select("*, packages(slug, title_id, title_en), payments(status, method, amount, created_at)")
    .eq("booking_code", code)
    .order("created_at", { referencedTable: "payments", ascending: false })
    .maybeSingle();
  if (!b) notFound();

  const payment = b.payments[0];
  const title = pick(b.packages, "title", lang);
  const wa = process.env.NEXT_PUBLIC_VENDOR_WA;
  const waText = encodeURIComponent(`Halo TeridoxTour, saya ingin bertanya tentang booking ${b.booking_code} (${title}).`);
  const rows: [string, string][] = [
    [t("booking_code"), b.booking_code],
    [t("date"), formatDate(b.booking_date, lang)],
    [t("participants"), `${b.participants} ${t("people")}`],
    [t("pickup"), b.pickup_location],
    ...(b.notes ? [[t("notes"), b.notes] as [string, string]] : []),
    [t("full_name"), profile?.full_name ?? ""],
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {b.status !== "pending" && b.status !== "cancelled" && (
        <p className="mb-6 flex items-center gap-2 font-semibold text-accent">
          <CheckCircle size={24} weight="fill" /> {b.status === "paid" ? t("paid_note") : t(`st_${b.status}` as DictKey)}
        </p>
      )}

      <section className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{t("invoice")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          </div>
          <StatusBadge status={b.status} label={t(`st_${b.status}` as DictKey)} />
        </div>

        <dl className="mt-8 grid gap-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[140px_1fr] gap-4">
              <dt className="text-muted">{k}</dt><dd className="break-words">{v}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[140px_1fr] gap-4">
            <dt className="text-muted">{t("payment_status")}</dt>
            <dd>
              {payment ? <StatusBadge status={payment.status} label={`${t(`pay_${payment.status}` as DictKey)}${payment.method ? ` (${payment.method})` : ""}`} /> : "-"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex justify-between border-t border-line pt-4 text-lg font-bold">
          <span>{t("total")}</span><span>{formatIDR(b.total_price)}</span>
        </div>

        {b.status === "pending" && (
          <form action={payBooking} className="mt-6 grid gap-3">
            <input type="hidden" name="code" value={b.booking_code} />
            <p className="text-sm text-muted">{t("pending_note")}</p>
            {payment_error && <p role="alert" className="text-sm font-medium text-danger">{t("err_PAYMENT")}</p>}
            <SubmitButton className="btn !py-3">{t("pay_now")}</SubmitButton>
          </form>
        )}
      </section>

      {wa && (
        <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noopener" className="btn-ghost mt-6 w-full !py-3">
          <WhatsappLogo size={20} /> {t("contact_vendor")}
        </a>
      )}
    </div>
  );
}
