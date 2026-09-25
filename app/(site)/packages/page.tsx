import Link from "next/link";
import { getT, type DictKey } from "@/lib/i18n";
import { BANDS, CATS, SORTS, getActivePackages, matchBand, matchCat, sorters } from "@/lib/packages";
import { PackageCard } from "@/components/PackageCard";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";

export const metadata = { title: "Packages" };

type SP = { cat?: string; band?: string; sort?: string };
const oneOf = <T extends readonly string[]>(list: T, v: string | undefined, d: T[number]) =>
  (list as readonly string[]).includes(v ?? "") ? (v as T[number]) : d;

export default async function PackagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const cat = oneOf(CATS, sp.cat, "all"), band = oneOf(BANDS, sp.band, "all"), sort = oneOf(SORTS, sp.sort, "popular");
  const [{ lang, t }, all] = await Promise.all([getT(), getActivePackages()]);
  const list = all.filter((p) => matchCat(p, cat) && matchBand(p, band)).sort(sorters[sort]);

  const href = (next: Partial<SP>) => {
    const q = new URLSearchParams({ cat, band, sort, ...next } as Record<string, string>);
    for (const [k, d] of [["cat", "all"], ["band", "all"], ["sort", "popular"]]) if (q.get(k) === d) q.delete(k);
    return `/packages${q.size ? `?${q}` : ""}`;
  };
  const row = (active: boolean) =>
    `block rounded-[9px] px-3 py-[9px] text-[14.5px] ${active ? "bg-accent-soft font-bold text-accent-deep" : "text-ink-3 hover:bg-sand"}`;
  const chips = [cat !== "all" && t(`cat_${cat}` as DictKey), band !== "all" && t(`band_${band}` as DictKey)].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-10 md:px-14">
      <p className="text-[13px] text-faint"><Link href="/">{t("nav_home")}</Link> / <span className="text-ink">{t("nav_packages")}</span></p>
      <h1 className="display mt-2.5 text-[40px] tracking-[-0.8px]">{t("all_packages")}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{list.length} {t("results_found")}</p>

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[268px_1fr]">
        <aside className="card p-6 lg:sticky lg:top-[100px]">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-faint">{t("category")}</p>
          <nav className="mt-3.5 flex flex-col gap-0.5">
            {CATS.map((c) => (
              <Link key={c} href={href({ cat: c })} className={row(cat === c)}>
                {t(`cat_${c}` as DictKey)}
                <span className="float-right text-[#a39a90]">{all.filter((p) => matchCat(p, c)).length}</span>
              </Link>
            ))}
          </nav>
          <div className="my-[22px] h-px bg-hair" />
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-faint">{t("price_range")}</p>
          <nav className="mt-3.5 flex flex-col gap-0.5">
            {BANDS.map((b) => <Link key={b} href={href({ band: b })} className={row(band === b)}>{t(`band_${b}` as DictKey)}</Link>)}
          </nav>
          <div className="my-[22px] h-px bg-hair" />
          <Link href="/packages" className="text-sm font-semibold text-accent-text">{t("reset")}</Link>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {chips.map((c) => (
                <span key={String(c)} className="rounded-full bg-accent-soft px-3.5 py-[7px] text-[13px] font-semibold text-accent-deep">{c}</span>
              ))}
            </div>
            <form className="flex items-center gap-2.5">
              {cat !== "all" && <input type="hidden" name="cat" value={cat} />}
              {band !== "all" && <input type="hidden" name="band" value={band} />}
              <label htmlFor="sort" className="text-sm text-muted">{t("sort_by")}</label>
              <AutoSubmitSelect id="sort" name="sort" defaultValue={sort}
                className="rounded-[10px] border border-line-2 bg-surface px-3 py-[9px] text-sm">
                {SORTS.map((s) => <option key={s} value={s}>{t(`sort_${s}` as DictKey)}</option>)}
              </AutoSubmitSelect>
              <noscript><button className="text-sm font-semibold text-accent-text">OK</button></noscript>
            </form>
          </div>
          {list.length === 0 ? (
            <div className="card px-6 py-16 text-center">
              <p className="text-muted">{t("no_packages")}</p>
              <Link href="/packages" className="mt-3 inline-block text-sm font-semibold text-accent-text">{t("reset")}</Link>
            </div>
          ) : (
            <div className="grid gap-[22px] sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p) => <PackageCard key={p.id} pkg={p} lang={lang} t={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
