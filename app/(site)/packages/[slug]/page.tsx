import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Star, X } from "@phosphor-icons/react/dist/ssr";
import { durationLabel, getT, pick, pickList } from "@/lib/i18n";
import { getPackageBySlug, getUnavailableDates } from "@/lib/packages";
import { formatIDR, todayWITA } from "@/lib/format";
import { DetailBookCard } from "@/components/DetailBookCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const pkg = await getPackageBySlug((await params).slug);
  return { title: pkg?.title_en || pkg?.title_id };
}

export default async function PackageDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ lang, t }, pkg] = await Promise.all([getT(), getPackageBySlug(slug)]);
  if (!pkg || !pkg.is_active) notFound();
  const unavailable = await getUnavailableDates(pkg.id);
  const title = pick(pkg, "title", lang);
  const gallery = [pkg.cover_image_url, ...pkg.package_images.map((i) => i.image_url)].filter(Boolean) as string[];
  const included = pickList(pkg, "includes", lang);
  const excluded = pickList(pkg, "excludes", lang);
  const keys = ["person", "fee_note", "availability", "selected", "full", "pick_date_book", "free_cancel"] as const;

  const tile = (src: string | undefined, cls: string) => (
    <div className={`overflow-hidden rounded-[20px] bg-gradient-to-br from-[#d9c3a5] to-[#b99270] ${cls}`}>
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-8 md:px-14">
      <Link href="/packages" className="text-sm text-muted hover:text-accent">&larr; {t("back_to_list")}</Link>
      <div className="mt-5 grid gap-3 md:h-[420px] md:grid-cols-[2fr_1fr] md:grid-rows-2">
        {tile(gallery[0], "aspect-[4/3] md:row-span-2 md:aspect-auto")}
        {tile(gallery[1], "hidden md:block")}
        {tile(gallery[2], "hidden md:block")}
      </div>

      <div className="mt-10 grid items-start gap-12 pb-16 lg:grid-cols-[1fr_388px]">
        <div>
          <div className="flex gap-2.5">
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-deep">{pkg.destination}</span>
            <span className="rounded-full bg-[#eaf0ec] px-3 py-1.5 text-xs font-semibold text-ok">{t("private_tour")}</span>
          </div>
          <h1 className="display mt-4 text-[34px] leading-[1.12] tracking-[-1px] md:text-[42px]">{title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-[14.5px] text-muted">
            {pkg.rating != null && <><Star weight="fill" className="text-accent" size={14} /> {pkg.rating.toFixed(1)} ·</>}
            {pkg.review_count != null && <> {pkg.review_count} {t("reviews")} ·</>}
            {" "}{durationLabel(pkg.duration_days, lang)} · {t("max_guests", { n: pkg.max_participants })}
          </p>
          <p className="mt-6 max-w-[640px] whitespace-pre-line text-base leading-[1.75] text-ink-2">{pick(pkg, "description", lang)}</p>

          {pkg.package_itinerary.length > 0 && (
            <>
              <h2 className="display mt-11 text-[26px]">{t("itinerary")}</h2>
              <ol className="mt-[22px]">
                {pkg.package_itinerary.map((d, i) => (
                  <li key={d.id} className="grid grid-cols-[72px_1fr] gap-5 pb-7 md:grid-cols-[96px_1fr]">
                    <span className="pt-[3px] text-xs font-bold uppercase tracking-[0.1em] text-accent-text">
                      {d.time_label || `${t("day")} ${i + 1}`}
                    </span>
                    <div className="relative border-l-2 border-[#ebdfd2] pl-6">
                      <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
                      <p className="text-[17px] font-bold">{pick(d, "title", lang)}</p>
                      {pick(d, "desc", lang) && <p className="mt-1.5 text-[14.5px] leading-[1.65] text-muted">{pick(d, "desc", lang)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}

          {(included.length > 0 || excluded.length > 0) && (
            <div className="card mt-5 grid gap-8 px-8 py-7 sm:grid-cols-2">
              <div>
                <p className="text-base font-bold text-ok">{t("included")}</p>
                <ul className="mt-3.5 flex flex-col gap-2.5 text-[14.5px] text-ink-2">
                  {included.map((x) => <li key={x} className="flex gap-2.5"><Check size={18} className="mt-0.5 shrink-0 text-ok" />{x}</li>)}
                </ul>
              </div>
              {excluded.length > 0 && (
                <div>
                  <p className="text-base font-bold text-danger">{t("excluded")}</p>
                  <ul className="mt-3.5 flex flex-col gap-2.5 text-[14.5px] text-ink-2">
                    {excluded.map((x) => <li key={x} className="flex gap-2.5"><X size={18} className="mt-0.5 shrink-0 text-danger" />{x}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DetailBookCard lang={lang} slug={pkg.slug} priceText={formatIDR(pkg.price)} minDate={todayWITA(1)} unavailable={unavailable}
          s={Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<(typeof keys)[number], string>} />
      </div>
    </div>
  );
}
