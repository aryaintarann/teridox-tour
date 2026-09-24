import { notFound } from "next/navigation";
import { getT, pick } from "@/lib/i18n";
import { getPackageBySlug, getUnavailableDates } from "@/lib/packages";
import { formatIDR, todayWITA } from "@/lib/format";
import { BookingForm } from "@/components/BookingForm";
import { createBooking } from "../actions";

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ lang, t }, pkg] = await Promise.all([getT(), getPackageBySlug(slug)]);
  if (!pkg || !pkg.is_active) notFound();

  const keys = ["pick_date", "participants", "pickup", "pickup_hint", "notes", "summary", "total", "per_booking", "continue_pay", "people"] as const;
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm text-muted">{t("book_title")}</p>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{pick(pkg, "title", lang)}</h1>
      <BookingForm
        action={createBooking}
        lang={lang}
        packageId={pkg.id}
        maxParticipants={pkg.max_participants}
        minDate={todayWITA(1)}
        unavailable={await getUnavailableDates(pkg.id)}
        priceText={formatIDR(pkg.price)}
        s={Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<(typeof keys)[number], string>}
      />
    </div>
  );
}
