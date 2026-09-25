"use server";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, safeNext } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { notifyBooking } from "@/lib/notify";
import type { FormState } from "@/components/ActionForm";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (fd: FormData, k: string) => str(fd, k).split("\n").map((l) => l.trim()).filter(Boolean);
const int = (fd: FormData, k: string) => Math.trunc(Number(fd.get(k)));
const optNum = (fd: FormData, k: string) => (str(fd, k) === "" ? null : Number(str(fd, k).replace(",", ".")));

export async function adminLogin(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: String(fd.get("password")) });
  if (error) return { error: t("err_login"), values: { email: str(fd, "email") } };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: t("admin_not_admin") };
  }
  redirect(safeNext(fd.get("next"), "/admin"));
}

export async function savePackage(_: FormState, fd: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  const db = createAdminClient();
  const id = str(fd, "id") || null;

  const pkg = {
    slug: str(fd, "slug").toLowerCase(),
    destination: str(fd, "destination"),
    title_id: str(fd, "title_id"),
    title_en: str(fd, "title_en"),
    description_id: str(fd, "description_id"),
    description_en: str(fd, "description_en"),
    includes_id: lines(fd, "includes_id"),
    includes_en: lines(fd, "includes_en"),
    excludes_id: lines(fd, "excludes_id"),
    excludes_en: lines(fd, "excludes_en"),
    duration_days: int(fd, "duration_days"),
    price: int(fd, "price"),
    capacity: int(fd, "capacity"),
    max_participants: int(fd, "max_participants"),
    rating: optNum(fd, "rating"),
    review_count: optNum(fd, "review_count"),
    is_active: fd.get("is_active") === "on",
  };
  if (!/^[a-z0-9-]+$/.test(pkg.slug)) return { error: "Slug: a-z, 0-9, -" };
  if (!pkg.title_id || !pkg.destination) return { error: "Title (ID) and destination are required." };
  if ([pkg.duration_days, pkg.price, pkg.capacity, pkg.max_participants].some((n) => !(n > 0))) {
    return { error: "Days, price, groups per day and max guests must be greater than 0." };
  }
  if (pkg.rating != null && !(pkg.rating >= 0 && pkg.rating <= 5)) return { error: "Rating must be between 0 and 5." };

  const saved = id
    ? await db.from("packages").update(pkg).eq("id", id).select("id").single()
    : await db.from("packages").insert({ ...pkg, created_by: user!.id }).select("id").single();
  if (saved.error) return { error: saved.error.code === "23505" ? "Slug already used." : saved.error.message };
  const pkgId = saved.data.id as string;

  // Itinerary: replace all rows.
  const titles = fd.getAll("it_title_id").map(String);
  const rows = titles
    .map((title_id, i) => ({
      package_id: pkgId,
      sort_order: i,
      time_label: String(fd.getAll("it_time")[i] ?? "").trim(),
      title_id: title_id.trim(),
      title_en: String(fd.getAll("it_title_en")[i] ?? "").trim(),
      desc_id: String(fd.getAll("it_desc_id")[i] ?? "").trim(),
      desc_en: String(fd.getAll("it_desc_en")[i] ?? "").trim(),
    }))
    .filter((r) => r.title_id);
  await db.from("package_itinerary").delete().eq("package_id", pkgId);
  if (rows.length) await db.from("package_itinerary").insert(rows.map((r, i) => ({ ...r, sort_order: i })));

  // Images: remove ticked, upload new.
  const remove = fd.getAll("remove_image").map(String);
  if (remove.length) await db.from("package_images").delete().in("id", remove).eq("package_id", pkgId);

  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const { count } = await db.from("package_images").select("id", { count: "exact", head: true }).eq("package_id", pkgId);
  for (const [i, file] of files.entries()) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return { error: `${file.name}: image, max 5MB.` };
    const path = `${pkgId}/${randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
    const up = await db.storage.from("package-images").upload(path, file, { contentType: file.type });
    if (up.error) return { error: up.error.message };
    const url = db.storage.from("package-images").getPublicUrl(path).data.publicUrl;
    await db.from("package_images").insert({ package_id: pkgId, image_url: url, sort_order: (count ?? 0) + i });
  }

  // Cover = first gallery image (keeps an existing cover when the package has no gallery yet).
  const { data: first } = await db
    .from("package_images").select("image_url").eq("package_id", pkgId).order("sort_order").limit(1).maybeSingle();
  if (first) await db.from("packages").update({ cover_image_url: first.image_url }).eq("id", pkgId);

  revalidatePath("/", "layout");
  redirect("/admin/packages");
}

export async function togglePackage(fd: FormData) {
  await requireAdmin();
  await createAdminClient().from("packages").update({ is_active: fd.get("active") !== "true" }).eq("id", str(fd, "id"));
  revalidatePath("/", "layout");
}

export async function deletePackage(fd: FormData) {
  await requireAdmin();
  const { error } = await createAdminClient().from("packages").delete().eq("id", str(fd, "id"));
  // FK restrict: packages with bookings cannot be deleted, only deactivated.
  if (error) redirect("/admin/packages?error=delete_blocked");
  revalidatePath("/", "layout");
  redirect("/admin/packages");
}

export async function setAvailability(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const { t } = await getT();
  const date = str(fd, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: t("err_generic") };
  const { error } = await createAdminClient()
    .from("availability")
    .upsert(
      { package_id: str(fd, "package_id"), date, slots_total: Math.max(0, int(fd, "slots_total")), is_blocked: fd.get("is_blocked") === "on" },
      { onConflict: "package_id,date" },
    );
  if (error) return { error: error.code === "23514" ? t("err_slots_below_booked") : error.message };
  revalidatePath("/admin/availability");
  return { ok: t("saved") };
}

export async function updateBookingStatus(fd: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const id = str(fd, "id");
  const action = str(fd, "action");
  const now = new Date().toISOString();

  if (action === "confirm") {
    const { data } = await db.from("bookings").update({ status: "confirmed", confirmed_at: now })
      .eq("id", id).eq("status", "paid").select("id").maybeSingle();
    if (data) after(() => notifyBooking(id, "booking_confirmed"));
  } else if (action === "reject") {
    const { data: released } = await db.rpc("release_booking", { p_booking: id });
    if (released) after(() => notifyBooking(id, "booking_cancelled"));
  } else if (action === "complete") {
    await db.from("bookings").update({ status: "completed", completed_at: now }).eq("id", id).eq("status", "confirmed");
  }
  revalidatePath("/admin", "layout");
}
