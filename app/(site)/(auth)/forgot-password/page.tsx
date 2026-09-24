import { getT } from "@/lib/i18n";
import { ActionForm } from "@/components/ActionForm";
import { AuthShell, Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { forgotPassword } from "../actions";

export default async function ForgotPage() {
  const { t } = await getT();
  return (
    <AuthShell title={t("forgot_title")}>
      <ActionForm action={forgotPassword}>
        <Field label={t("email")} name="email" type="email" autoComplete="email" required />
        <SubmitButton>{t("forgot_cta")}</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
