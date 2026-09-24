import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, UsersThree, X } from "@phosphor-icons/react/dist/ssr";
import { getT, pick, pickList } from "@/lib/i18n";
import { getPackageBySlug, getUnavailableDates } from "@/lib/packages";
import { formatIDR, todayWITA } from "@/lib/format";
import { Calendar } from "@/components/Calendar";

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
  const includes = pickList(pkg, "includes", lang);
  const excludes = pickList(pkg, "excludes", lang);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {gallery.length > 0 && (
        <div className="grid gap-2 md:h-[460px] md:grid-cols-[2fr_1fr] md:grid-rows-2">
          <img src={gallery[0]} alt={title} fetchPriority="high"
            className="aspect-[4/3] h-full w-full rounded-2xl object-cover md:row-span-2 md:aspect-auto" />
          {gallery.slice(1, 3).map((src) => (
            <img key={src} src={src} alt="" loading="lazy" className="hidden h-full w-full rounded-2xl object-cover md:block" />
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
          <p className="mt-3 flex flex-wrap gap-4 text-muted">
            <span className="inline-flex items-center gap-1.5"><Clock size={18} /> {pkg.duration_hours} {t("hours")}</span>
            <span className="inline-flex items-center gap-1.5"><UsersThree size={18} /> {t("up_to")} {pkg.max_participants} {t("people")}</span>
          </p>
          <p className="mt-6 max-w-[65ch] whitespace-pre-line leading-relaxed">{pick(pkg, "description", lang)}</p>

          {(includes.length > 0 || excludes.length > 0) && (
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="mb-3 font-semibold">{t("includes")}</h2>
                <ul className="grid gap-2">
                  {includes.map((x) => <li key={x} className="flex gap-2"><Check size={20} className="shrink-0 text-accent" /> {x}</li>)}
                </ul>
              </div>
              {excludes.length > 0 && (
                <div>
                  <h2 className="mb-3 font-semibold">{t("excludes")}</h2>
                  <ul className="grid gap-2 text-muted">
                    {excludes.map((x) => <li key={x} className="flex gap-2"><X size={20} className="shrink-0 text-danger" /> {x}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {pkg.package_itinerary.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-5 text-xl font-bold">{t("itinerary")}</h2>
              <ol className="relative grid gap-6 border-l border-line pl-6">
                {pkg.package_itinerary.map((s) => (
                  <li key={s.id} className="relative">
                    <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <p className="text-sm font-semibold text-accent">{s.time_label}</p>
                    <p className="font-semibold">{pick(s, "title", lang)}</p>
                    {pick(s, "desc", lang) && <p className="mt-1 text-muted">{pick(s, "desc", lang)}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <p className="text-sm text-muted">{t("from")}</p>
          <p className="text-2xl font-bold">{formatIDR(pkg.price)} <span className="text-sm font-normal text-muted">/ {t("per_booking")}</span></p>
          <h2 className="mb-3 mt-6 font-semibold">{t("availability")}</h2>
          <Calendar lang={lang} minDate={todayWITA(1)} unavailable={unavailable} />
          <p className="mt-3 flex gap-4 text-xs text-muted">
            <span>{t("available")}</span>
            <span className="text-danger line-through">{t("full")}</span>
          </p>
          <Link href={`/book/${pkg.slug}`} className="btn mt-6 w-full !py-3 text-base">{t("book_now")}</Link>
        </aside>
      </div>
    </div>
  );
}
