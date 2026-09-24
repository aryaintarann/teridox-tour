import Link from "next/link";
import { ArrowRight, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getT, testimonials } from "@/lib/i18n";
import { PackageCard } from "@/components/PackageCard";
import type { Pkg } from "@/lib/packages";

export default async function Home() {
  const { lang, t } = await getT();
  const supabase = await createClient();
  // ponytail: "popular" = newest active packages; switch to booking counts once there is real volume
  const { data } = await supabase.from("packages").select("*").eq("is_active", true).order("created_at").limit(4);
  const packages = (data ?? []) as Pkg[];
  const wa = process.env.NEXT_PUBLIC_VENDOR_WA;

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:pt-16">
        <div className="rise">
          <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            {t("hero_title")}
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted">{t("hero_sub")}</p>
          <Link href="/packages" className="btn mt-8 !px-6 !py-3 text-base">
            {t("hero_cta")} <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
        <div className="rise overflow-hidden rounded-2xl bg-line [animation-delay:120ms]">
          <img src="https://picsum.photos/seed/teridox-hero-bali/1400/1100" alt="" fetchPriority="high"
            className="aspect-[5/4] h-full w-full object-cover" />
        </div>
      </section>

      {packages.length > 0 && <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("popular")}</h2>
          <Link href="/packages" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            {t("all_packages")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            {packages.slice(0, 3).map((p, i) => (
              <div key={p.id} className={i === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""}>
                <PackageCard pkg={p} lang={lang} t={t} large={i === 0} />
              </div>
            ))}
            {packages[3] && <PackageCard pkg={packages[3]} lang={lang} t={t} />}
        </div>
      </section>}

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-10 text-2xl font-bold tracking-tight md:text-3xl">{t("testimonials")}</h2>
        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {testimonials[lang].map((q) => (
            <figure key={q.name} className="border-l-2 border-accent pl-5">
              <blockquote className="leading-relaxed">&ldquo;{q.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm text-muted">
                <span className="font-semibold text-ink">{q.name}</span>, {q.from}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {wa && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-6 rounded-2xl bg-accent px-6 py-10 text-accent-fg md:flex-row md:items-center md:justify-between md:px-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{t("contact_title")}</h2>
              <p className="mt-2 max-w-[50ch] opacity-85">{t("contact_sub")}</p>
            </div>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent-fg px-6 py-3 font-semibold text-accent transition active:scale-[0.98]">
              <WhatsappLogo size={20} weight="fill" /> {t("contact_cta")}
            </a>
          </div>
        </section>
      )}
    </>
  );
}
