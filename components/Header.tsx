import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setLang } from "@/app/actions";
import { LangToggle } from "@/components/LangToggle";

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-accent text-[15px] font-bold text-white">T</span>
      <span className={`display text-[22px] ${dark ? "text-white" : ""}`}>Teridox<span className="text-accent">Tour</span></span>
    </span>
  );
}

export async function Header() {
  const [{ profile }, { lang, t }] = await Promise.all([getSession(), getT()]);
  const shortName = profile?.full_name.split(/\s+/).slice(0, 2).map((w, i) => (i ? w[0] + "." : w)).join(" ");
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center gap-8 px-4 md:px-14">
        <Link href="/" aria-label="TeridoxTour"><Logo /></Link>
        <nav className="hidden gap-7 text-[15px] text-ink-3 lg:flex">
          <Link href="/" className="hover:text-accent">{t("nav_home")}</Link>
          <Link href="/packages" className="hover:text-accent">{t("nav_packages")}</Link>
          <Link href="/packages?cat=komodo" className="hover:text-accent">{t("nav_dest")}</Link>
          <Link href="/#about" className="hover:text-accent">{t("nav_about")}</Link>
        </nav>
        <div className="flex-1" />
        <LangToggle lang={lang} action={setLang} />
        {profile ? (
          <Link href="/account" className="flex items-center gap-2.5 rounded-full border border-line-2 bg-surface py-1.5 pl-1.5 pr-3.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#e8ddce] text-[13px] font-bold text-[#7a5638]">
              {initials(profile.full_name)}
            </span>
            <span className="hidden text-sm font-semibold sm:inline">{shortName}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-1 sm:gap-3">
            <Link href="/login" className="px-2 py-2.5 text-[15px] font-semibold sm:px-3.5">{t("login")}</Link>
            <Link href="/register" className="hidden rounded-full bg-ink px-5 py-[11px] text-[15px] font-semibold text-white transition hover:bg-accent sm:inline-flex">
              {t("register")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
