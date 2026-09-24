import Link from "next/link";
import { Clock, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { pick, type Lang, type DictKey } from "@/lib/i18n";
import { formatIDR } from "@/lib/format";
import type { Pkg } from "@/lib/packages";

export function PackageCard({ pkg, lang, t, large = false }: { pkg: Pkg; lang: Lang; t: (k: DictKey) => string; large?: boolean }) {
  return (
    <Link href={`/packages/${pkg.slug}`} className="group block">
      <div className={`overflow-hidden rounded-2xl bg-line ${large ? "aspect-[4/3] md:aspect-[16/11]" : "aspect-[4/3]"}`}>
        {pkg.cover_image_url && (
          <img src={pkg.cover_image_url} alt={pick(pkg, "title", lang)} loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h3 className={`font-semibold leading-snug ${large ? "text-xl" : "text-base"}`}>{pick(pkg, "title", lang)}</h3>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1"><Clock size={16} /> {pkg.duration_hours} {t("hours")}</span>
            <span className="inline-flex items-center gap-1"><UsersThree size={16} /> {t("up_to")} {pkg.max_participants}</span>
          </p>
        </div>
        <p className="shrink-0 text-right text-sm">
          <span className="block text-muted">{t("from")}</span>
          <span className="font-semibold">{formatIDR(pkg.price)}</span>
        </p>
      </div>
    </Link>
  );
}
