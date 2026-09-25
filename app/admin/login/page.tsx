import Link from "next/link";
import { getT } from "@/lib/i18n";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { adminLogin } from "../actions";

export const metadata = { title: "Vendor sign in" };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const { t } = await getT();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-console px-4">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent font-bold text-white">T</span>
          <span className="display text-[22px] text-white">TeridoxTour <span className="font-sans text-sm uppercase tracking-[0.1em] text-console-muted">Console</span></span>
        </div>
        <div className="mt-[26px] rounded-[20px] border border-console-line bg-console-2 p-[34px]">
          <h1 className="text-[21px] font-bold text-white">{t("admin_login_title")}</h1>
          <p className="mt-1.5 text-sm text-console-muted">{t("admin_login_sub")}</p>
          <AdminLoginForm action={adminLogin} next={next} s={{ email: t("email"), password: t("password"), enter: t("enter_dashboard") }} />
        </div>
        <Link href="/" className="mt-5 block text-center text-[13px] text-[#69727d] hover:text-white">&larr; {t("back_to_site")}</Link>
      </div>
    </div>
  );
}
