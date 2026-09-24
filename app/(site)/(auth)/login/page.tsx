import Link from "next/link";
import { getT } from "@/lib/i18n";
import { ActionForm } from "@/components/ActionForm";
import { AuthShell, Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { login } from "../actions";

export const metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const { t } = await getT();
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell title={t("login_title")}>
      <ActionForm action={login}>
        <input type="hidden" name="next" value={next} />
        <Field label={t("email")} name="email" type="email" autoComplete="email" required />
        <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
        <Link href="/forgot-password" className="-mt-2 text-sm text-accent">{t("forgot")}</Link>
        <SubmitButton>{t("nav_login")}</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-sm text-muted">
        {t("no_account")} <Link href={`/register${q}`} className="font-semibold text-accent">{t("register_cta")}</Link>
      </p>
    </AuthShell>
  );
}
