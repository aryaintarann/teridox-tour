import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { CATEGORIES, type Pkg } from "@/lib/packages";
import { PackageCard } from "@/components/PackageCard";

export const metadata = { title: "Tours" };

export default async function PackagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { category, min, max } = await searchParams;
  const { lang, t } = await getT();
  const supabase = await createClient();

  let q = supabase.from("packages").select("*").eq("is_active", true).order("price");
  if (category && (CATEGORIES as readonly string[]).includes(category)) q = q.eq("category", category);
  if (Number(min) > 0) q = q.gte("price", Number(min));
  if (Number(max) > 0) q = q.lte("price", Number(max));
  const packages = ((await q).data ?? []) as Pkg[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("nav_packages")}</h1>

      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1.5">
          <span className="label">{t("filter_category")}</span>
          <select name="category" defaultValue={category ?? ""} className="input">
            <option value="">{t("filter_all")}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat_${c}`)}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="label">{t("filter_min")}</span>
          <input name="min" type="number" min={0} step={50000} defaultValue={min} className="input" inputMode="numeric" />
        </label>
        <label className="grid gap-1.5">
          <span className="label">{t("filter_max")}</span>
          <input name="max" type="number" min={0} step={50000} defaultValue={max} className="input" inputMode="numeric" />
        </label>
        <button className="btn">{t("filter_apply")}</button>
      </form>

      {packages.length === 0 ? (
        <p className="mt-16 text-center text-muted">{t("no_packages")}</p>
      ) : (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => <PackageCard key={p.id} pkg={p} lang={lang} t={t} />)}
        </div>
      )}
    </div>
  );
}
