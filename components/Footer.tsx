import Link from "next/link";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/site";

export async function Footer() {
  const { t } = await getT();
  return (
    <footer className="mt-[72px] bg-ink px-4 py-14 text-[#ede6dc] md:px-14">
      <div className="mx-auto grid max-w-[1280px] gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="display text-2xl">Teridox<span className="text-[#e08a4d]">Tour</span></p>
          <p className="mt-3 max-w-[280px] text-sm leading-[1.7] text-[#9c9287]">{t("footer_about")}</p>
        </div>
        <FooterCol title={t("explore")}>
          <Link href="/packages">{t("nav_packages")}</Link>
          <Link href="/packages?cat=bali">Bali</Link>
          <Link href="/packages?cat=komodo">Labuan Bajo</Link>
        </FooterCol>
        <FooterCol title={t("company")}>
          <Link href="/#about">{t("nav_about")}</Link>
          <Link href="/login">{t("login")}</Link>
          <Link href="/register">{t("register")}</Link>
        </FooterCol>
        <FooterCol title={t("contact")}>
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
          <Link href="/admin/login" className="!text-[#7f766b]">{t("admin_entry")}</Link>
        </FooterCol>
      </div>
      <div className="mx-auto mt-11 flex max-w-[1280px] flex-col gap-2 border-t border-[#322c26] pt-6 text-[13px] text-[#7f766b] sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} TeridoxTour. {t("rights")}</p>
        <p>{t("powered_by")} <span className="font-extrabold text-[#c7beb2]">DOKU</span></p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#7f766b]">{title}</p>
      <div className="mt-3.5 flex flex-col gap-[9px] text-sm text-[#c7beb2] [&_a:hover]:text-white">{children}</div>
    </div>
  );
}
