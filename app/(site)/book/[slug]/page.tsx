import Link from "next/link";
import { notFound } from "next/navigation";
import { durationLabel, getT, pick } from "@/lib/i18n";
import { getPackageBySlug, getUnavailableDates } from "@/lib/packages";
import { todayWITA } from "@/lib/format";
import { BookingForm } from "@/components/BookingForm";
import { Stepper } from "@/components/Stepper";
import { createBooking } from "../actions";

export const metadata = { title: "Booking" };

export default async function BookPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ date?: string }>;
}) {
  const [{ slug }, { date }] = await Promise.all([params, searchParams]);
  const [{ lang, t }, pkg] = await Promise.all([getT(), getPackageBySlug(slug)]);
  if (!pkg || !pkg.is_active) notFound();
  const unavailable = await getUnavailableDates(pkg.id);
  const minDate = todayWITA(1);
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= minDate && !unavailable.includes(date) ? date : undefined;

  const keys = ["choose_date", "full_disabled", "travellers", "pickup", "pickup_airport", "pickup_hotel", "pickup_port", "notes", "notes_ph",
    "price_summary", "date", "service_fee", "tax", "total", "continue_payment", "secured_by", "pick_date_first"] as const;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-[72px] pt-9 md:px-14">
      <Stepper step={1} labels={[t("step_details"), t("step_payment"), t("step_done")]} />
      <h1 className="display mt-3.5 text-[36px] tracking-[-0.8px]">{t("booking_title")}</h1>
      <BookingForm
        action={createBooking} lang={lang} packageId={pkg.id} price={pkg.price} maxParticipants={pkg.max_participants}
        minDate={minDate} initialDate={initialDate} unavailable={unavailable}
        s={Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<(typeof keys)[number], string>}
        header={
          <div className="card flex gap-[18px] p-6">
            <div className="h-[92px] w-[120px] shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#d9c3a5] to-[#b99270]">
              {pkg.cover_image_url && <img src={pkg.cover_image_url} alt="" className="h-full w-full object-cover" />}
            </div>
            <div>
              <p className="display text-[22px] leading-[1.25]">{pick(pkg, "title", lang)}</p>
              <p className="mt-1.5 text-[13.5px] text-muted">
                {pkg.destination} · {durationLabel(pkg.duration_days, lang)}{pkg.rating != null && ` · ★ ${pkg.rating.toFixed(1)}`}
              </p>
              <Link href={`/packages/${pkg.slug}`} className="mt-2.5 inline-block text-[13.5px] font-semibold text-accent-text">{t("change_package")}</Link>
            </div>
          </div>
        }
      />
    </div>
  );
}
