import { getT } from "@/lib/i18n";
import { ActionForm } from "@/components/ActionForm";
import { AuthShell, Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { resetPassword } from "../actions";

export default async function ResetPage() {
  const { t } = await getT();
  return (
    <AuthShell title={t("reset_title")}>
      <ActionForm action={resetPassword}>
        <Field label={t("new_password")} name="password" type="password" autoComplete="new-password" minLength={8} required />
        <SubmitButton>{t("save")}</SubmitButton>
      </ActionForm>
    </AuthShell>
  );
}
