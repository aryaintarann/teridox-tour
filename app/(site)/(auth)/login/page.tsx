import Link from "next/link";
import { getT } from "@/lib/i18n";
import { LoginForm } from "@/components/AuthForms";
import { login } from "../actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const { t } = await getT();
  return (
    <div className="flex justify-center px-4 pb-[100px] pt-20">
      <div className="w-full max-w-[440px]">
        <h1 className="display text-center text-[36px] tracking-[-0.8px]">{t("login_title")}</h1>
        <p className="mt-2 text-center text-[15px] text-muted">{t("login_sub")}</p>
        <div className="card mt-7 flex flex-col gap-[18px] p-8">
          <LoginForm action={login} next={next} s={{ email: t("email"), password: t("password"), forgot: t("forgot"), login: t("login") }} />
          <p className="text-center text-sm text-muted">
            {t("no_account")} <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-accent-text">{t("register")}</Link>
          </p>
        </div>
        <Link href="/admin/login" className="mt-5 block text-center text-[13px] text-faint hover:text-accent">{t("admin_entry")} &rarr;</Link>
      </div>
    </div>
  );
}
