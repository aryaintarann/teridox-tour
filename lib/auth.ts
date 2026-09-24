import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "customer" | "admin";
  preferred_lang: "id" | "en";
};

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single<Profile>();
  return { supabase, user: data.user, profile };
}

export async function requireAdmin() {
  const session = await getSession();
  if (session.profile?.role !== "admin") redirect("/admin/login");
  return session;
}

// Only allow same-site relative redirects after login.
export function safeNext(next: unknown, fallback = "/account") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
