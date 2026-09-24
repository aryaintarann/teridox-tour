import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { setLang } from "@/app/actions";

export async function Header() {
  const [{ user }, { lang, t }] = await Promise.all([getSession(), getT()]);
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Teridox<span className="text-accent">Tour</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link href="/packages" className="rounded-full px-3 py-2 hover:bg-accent-soft">{t("nav_packages")}</Link>
          <form action={setLang}>
            <input type="hidden" name="lang" value={lang === "id" ? "en" : "id"} />
            <button className="rounded-full px-3 py-2 font-semibold hover:bg-accent-soft" aria-label="Switch language">
              {lang === "id" ? "EN" : "ID"}
            </button>
          </form>
          {user ? (
            <Link href="/account" className="btn-ghost !px-4 !py-2">{t("nav_account")}</Link>
          ) : (
            <Link href="/login" className="btn !px-4 !py-2">{t("nav_login")}</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
