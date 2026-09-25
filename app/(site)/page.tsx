import Link from "next/link";
import { Anchor, CalendarX, Star, Tag } from "@phosphor-icons/react/dist/ssr";
import { getT, testimonials } from "@/lib/i18n";
import { getActivePackages, sorters } from "@/lib/packages";
import { SITE } from "@/lib/site";
import { PackageCard } from "@/components/PackageCard";

export default async function Home() {
  const [{ lang, t }, all] = await Promise.all([getT(), getActivePackages()]);
  const featured = [...all].sort(sorters.popular).slice(0, 3);
  const rated = all.filter((p) => p.rating != null);
  const avg = rated.length ? (rated.reduce((s, p) => s + p.rating!, 0) / rated.length).toFixed(1) : null;

  const stats = [
    [String(all.length), t("stat1")],
    ...(avg ? [[avg, t("stat2")]] : []),
    [SITE.guestsHosted, t("stat3")],
    [String(SITE.since), t("stat4")],
  ];
  const whys = [
    [Anchor, t("why1_t"), t("why1_d")],
    [Tag, t("why2_t"), t("why2_d")],
    [CalendarX, t("why3_t"), t("why3_d")],
  ] as const;

  return (
    <div className="mx-auto max-w-[1280px]">
      <section className="relative mx-3 mt-6 overflow-hidden rounded-[28px] bg-[linear-gradient(140deg,#2e2a26_0%,#4a3b2e_45%,#8a5a33_100%)] md:mx-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_78%_15%,rgba(255,214,164,.35),transparent_60%),radial-gradient(60%_70%_at_15%_95%,rgba(0,0,0,.45),transparent)]" />
        <div className="relative grid items-center gap-10 px-6 py-14 md:px-14 lg:min-h-[520px] lg:grid-cols-[600px_1fr] lg:py-0">
          <div className="rise text-white">
            <p className="mb-5 text-xs uppercase tracking-[0.2em] text-[#f0c79c]">{t("hero_kicker")}</p>
            <h1 className="display text-[40px] leading-[1.06] tracking-[-1.5px] md:text-[60px]">{t("hero_title")}</h1>
            <p className="mt-5 max-w-[460px] text-[17px] leading-[1.6] text-white/80">{t("hero_sub")}</p>
            <div className="mt-[34px] flex flex-wrap gap-3.5">
              <Link href="/packages" className="btn">{t("cta_explore")}</Link>
              <Link href="/register" className="inline-flex items-center rounded-full border border-white/40 px-7 py-4 text-[15px] font-semibold text-white transition hover:bg-white/10">
                {t("cta_join")}
              </Link>
            </div>
          </div>
          <div className="rise hidden h-[380px] overflow-hidden rounded-[22px] border border-white/20 lg:block [animation-delay:120ms]">
            <img src="https://picsum.photos/seed/teridox-hero-padar/1040/760" alt="" fetchPriority="high" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <div className={`mx-4 my-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:mx-14 ${stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        {stats.map(([value, label]) => (
          <div key={label} className="bg-bg px-7 py-6">
            <p className="display text-[30px]">{value}</p>
            <p className="mt-1 text-[13px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      {featured.length > 0 && (
        <section className="px-4 pt-5 md:px-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display text-[36px] tracking-[-0.6px]">{t("popular")}</h2>
              <p className="mt-1.5 text-[15px] text-muted">{t("popular_sub")}</p>
            </div>
            <Link href="/packages" className="text-[15px] font-semibold text-accent-text">{t("view_all")} &rarr;</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => <PackageCard key={p.id} pkg={p} lang={lang} t={t} tall />)}
          </div>
        </section>
      )}

      <section className="mx-4 mt-16 rounded-3xl border border-line bg-surface px-6 py-11 md:mx-14 md:px-12">
        <h2 className="display text-[32px] tracking-[-0.5px]">{t("testi")}</h2>
        <div className="mt-7 grid gap-7 md:grid-cols-3">
          {testimonials[lang].map((q) => (
            <figure key={q.name} className="border-l-2 border-[#ebdfd2] pl-5">
              <div className="flex gap-0.5 text-accent" aria-label="5/5">
                {Array.from({ length: 5 }, (_, i) => <Star key={i} weight="fill" size={14} />)}
              </div>
              <blockquote className="display mt-3 text-lg leading-[1.55] text-[#2a2520]">&ldquo;{q.quote}&rdquo;</blockquote>
              <figcaption className="mt-3.5 text-[13.5px] text-muted">{q.name}, {q.from}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="about" className="mx-4 mt-10 grid scroll-mt-24 gap-6 md:mx-14 md:grid-cols-3">
        {whys.map(([Icon, title, desc]) => (
          <div key={title} className="rounded-[18px] border border-line bg-surface px-7 py-[26px]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text"><Icon size={20} /></span>
            <p className="mt-4 text-[17px] font-bold">{title}</p>
            <p className="mt-1.5 text-sm leading-[1.6] text-muted">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
