"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { safeNext } from "@/lib/auth";
import type { FormState } from "@/components/ActionForm";

const site = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: String(fd.get("password")) });
  if (error) return { error: t("err_login") };
  redirect(safeNext(fd.get("next")));
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const { lang, t } = await getT();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: t("err_password") };
  const full_name = str(fd, "full_name"), phone = str(fd, "phone");
  if (!full_name || !phone) return { error: t("err_generic") };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: str(fd, "email"),
    password,
    options: { data: { full_name, phone, preferred_lang: lang }, emailRedirectTo: `${site()}/auth/callback` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect(safeNext(fd.get("next")));
  return { ok: t("check_email") };
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(str(fd, "email"), { redirectTo: `${site()}/auth/callback?next=/reset-password` });
  return { ok: t("forgot_sent") }; // same answer either way, so registered emails are not revealed
}

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: t("err_password") };
  const { error } = await (await createClient()).auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/account");
}
