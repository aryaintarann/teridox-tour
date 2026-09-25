import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n";
import { signOut, setLang } from "@/app/actions";
import { initials } from "@/components/Header";
import { LangToggle } from "@/components/LangToggle";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata = { title: { default: "Console", template: "%s | TeridoxTour Console" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ profile }, { lang, t }] = await Promise.all([requireAdmin(), getT()]);
  // "New booking" notification = paid, waiting for vendor confirmation.
  const { count } = await createAdminClient().from("bookings").select("id", { count: "exact", head: true }).eq("status", "paid");

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[248px_1fr]">
      <aside className="flex flex-col bg-console px-[18px] py-4 md:py-[26px]">
        <div className="flex items-center gap-2.5 px-2 pb-4 md:pb-[22px]">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-accent text-sm font-bold text-white">T</span>
          <div>
            <p className="display text-[17px] leading-[1.1] text-white">TeridoxTour</p>
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#69727d]">Vendor Console</p>
          </div>
        </div>
        <div className="mb-[18px] hidden h-px bg-console-3 md:block" />
        <AdminNav badge={count ?? 0} items={[
          { href: "/admin/packages", label: t("manage_packages"), icon: "packages" },
          { href: "/admin/bookings", label: t("manage_bookings"), icon: "bookings" },
          { href: "/admin/availability", label: t("manage_availability"), icon: "availability" },
          { href: "/admin", label: t("reports"), icon: "reports" },
        ]} />
        <div className="hidden flex-1 md:block" />
        <p className="mt-4 hidden rounded-[14px] bg-console-2 p-4 text-[13px] leading-[1.6] text-console-muted md:block">{t("admin_tip")}</p>
        <form action={signOut} className="hidden md:block">
          <button className="mt-3.5 flex w-full items-center gap-2 rounded-[10px] px-3 py-[11px] text-sm text-console-muted hover:bg-console-2">
            <SignOut size={16} /> {t("logout")}
          </button>
        </form>
      </aside>

      <div className="min-w-0 bg-admin-bg">
        <div className="flex h-[68px] items-center gap-4 border-b border-admin-line bg-surface px-4 md:px-8">
          <div className="flex-1" />
          <LangToggle lang={lang} action={setLang} dark />
          <div className="flex items-center gap-2.5 border-l border-admin-line pl-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dce1e7] text-[12.5px] font-bold text-[#4a5460]">{initials(profile?.full_name ?? "")}</span>
            <div className="hidden sm:block">
              <p className="text-[13.5px] font-semibold leading-tight">{profile?.full_name}</p>
              <p className="text-[11.5px] text-admin-muted">{t("role_admin")}</p>
            </div>
          </div>
        </div>
        <main className="px-4 pb-[60px] pt-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
