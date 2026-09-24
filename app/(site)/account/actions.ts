"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import type { FormState } from "@/components/ActionForm";

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await getSession();
  if (!user) return { error: "Unauthorized" };
  const preferred_lang = fd.get("preferred_lang") === "en" ? "en" : "id";
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(fd.get("full_name") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      preferred_lang,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  (await cookies()).set("lang", preferred_lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
  const { t } = await getT();
  return { ok: t("saved") };
}
