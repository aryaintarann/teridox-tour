import Link from "next/link";
import { getT } from "@/lib/i18n";
import { ActionForm } from "@/components/ActionForm";
import { AuthShell, Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { register } from "../actions";

export const metadata = { title: "Register" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const { t } = await getT();
  return (
    <AuthShell title={t("register_title")}>
      <ActionForm action={register}>
        <input type="hidden" name="next" value={next} />
        <Field label={t("full_name")} name="full_name" autoComplete="name" required />
        <Field label={t("email")} name="email" type="email" autoComplete="email" required />
        <Field label={t("phone")} name="phone" type="tel" autoComplete="tel" placeholder="+62 812 3456 7890" required />
        <Field label={t("password")} name="password" type="password" autoComplete="new-password" minLength={8} required />
        <SubmitButton>{t("register_cta")}</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-sm text-muted">
        {t("have_account")} <Link href="/login" className="font-semibold text-accent">{t("nav_login")}</Link>
      </p>
    </AuthShell>
  );
}
