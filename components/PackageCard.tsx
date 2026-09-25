import Link from "next/link";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { durationLabel, pick, type Lang, type T } from "@/lib/i18n";
import { formatIDR } from "@/lib/format";
import type { Pkg } from "@/lib/packages";

export function PackageCard({ pkg, lang, t, tall = false }: { pkg: Pkg; lang: Lang; t: T; tall?: boolean }) {
  const title = pick(pkg, "title", lang);
  return (
    <Link href={`/packages/${pkg.slug}`}
      className="group block overflow-hidden rounded-[20px] border border-line bg-surface transition hover:border-accent">
      <div className={`relative bg-gradient-to-br from-[#d9c3a5] to-[#b99270] ${tall ? "h-[200px]" : "h-[150px]"}`}>
        {pkg.cover_image_url && (
          <img src={pkg.cover_image_url} alt={title} loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
        <span className="absolute left-3.5 top-3.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold text-white">{pkg.destination}</span>
      </div>
      <div className={tall ? "p-5" : "p-[18px]"}>
        <div className="flex items-start justify-between gap-3">
          <h3 className={`display leading-[1.25] ${tall ? "text-[21px]" : "text-[19px]"}`}>{title}</h3>
          {pkg.rating != null && (
            <span className="flex items-center gap-1 whitespace-nowrap text-[13px] font-bold">
              <Star weight="fill" className="text-accent" size={14} /> {pkg.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-2 text-[13.5px] text-muted">
          {durationLabel(pkg.duration_days, lang)}
          {pkg.review_count != null && <> · {pkg.review_count} {t("reviews")}</>}
        </p>
        <div className={`flex items-baseline gap-1.5 ${tall ? "mt-4 border-t border-hair pt-4" : "mt-3.5"}`}>
          <span className="text-xs text-muted">{t("from")}</span>
          <span className={`font-bold text-accent-text ${tall ? "text-[19px]" : "text-[17px]"}`}>{formatIDR(pkg.price)}</span>
          <span className="text-xs text-muted">/ {t("person")}</span>
        </div>
      </div>
    </Link>
  );
}
