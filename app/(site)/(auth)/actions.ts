"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { safeNext } from "@/lib/auth";
import type { FormState } from "@/components/ActionForm";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const email = str(fd, "email"), password = String(fd.get("password") ?? "");
  const fields: Record<string, string> = {};
  if (!EMAIL.test(email)) fields.email = email ? t("err_email") : t("err_required");
  if (!password) fields.password = t("err_required");
  if (Object.keys(fields).length) return { fields, values: { email } };

  const { error } = await (await createClient()).auth.signInWithPassword({ email, password });
  if (error) return { error: t("err_login"), values: { email } };
  redirect(safeNext(fd.get("next")));
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const { lang, t } = await getT();
  const v = { full_name: str(fd, "full_name"), email: str(fd, "email"), phone: str(fd, "phone") };
  const password = String(fd.get("password") ?? ""), password2 = String(fd.get("password2") ?? "");
  const fields: Record<string, string> = {};
  if (!v.full_name) fields.full_name = t("err_required");
  if (!EMAIL.test(v.email)) fields.email = v.email ? t("err_email") : t("err_required");
  if (v.phone.replace(/\D/g, "").length < 9) fields.phone = v.phone ? t("err_phone") : t("err_required");
  if (password.length < 8) fields.password = t("err_pass_short");
  if (password2 !== password) fields.password2 = t("err_pass_match");
  if (fd.get("agree") !== "on") fields.agree = t("err_agree");
  if (Object.keys(fields).length) return { fields, values: v };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password,
    options: { data: { full_name: v.full_name, phone: v.phone, preferred_lang: lang }, emailRedirectTo: `${site()}/auth/callback` },
  });
  if (error) return { error: error.message, values: v };
  if (data.session) redirect(safeNext(fd.get("next"), "/packages"));
  return { ok: t("check_email"), values: v };
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  await (await createClient()).auth.resetPasswordForEmail(str(fd, "email"), {
    redirectTo: `${site()}/auth/callback?next=/reset-password`,
  });
  return { ok: t("forgot_sent") }; // same answer either way, so registered emails are not revealed
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: t("err_pass_short") };
  const { error } = await (await createClient()).auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/account");
}
