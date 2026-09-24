"use server";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, safeNext } from "@/lib/auth";
import { notifyBooking } from "@/lib/notify";
import { CATEGORIES } from "@/lib/packages";
import type { FormState } from "@/components/ActionForm";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const lines = (fd: FormData, k: string) => str(fd, k).split("\n").map((l) => l.trim()).filter(Boolean);
const int = (fd: FormData, k: string) => Math.trunc(Number(fd.get(k)));

export async function adminLogin(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: str(fd, "email"), password: String(fd.get("password")) });
  if (error) return { error: "Email atau password salah." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "Akun ini bukan admin." };
  }
  redirect(safeNext(fd.get("next"), "/admin"));
}

export async function savePackage(_: FormState, fd: FormData): Promise<FormState> {
  const { user } = await requireAdmin();
  const db = createAdminClient();
  const id = str(fd, "id") || null;

  const pkg = {
    slug: str(fd, "slug").toLowerCase(),
    category: str(fd, "category"),
    title_id: str(fd, "title_id"),
    title_en: str(fd, "title_en"),
    description_id: str(fd, "description_id"),
    description_en: str(fd, "description_en"),
    includes_id: lines(fd, "includes_id"),
    includes_en: lines(fd, "includes_en"),
    excludes_id: lines(fd, "excludes_id"),
    excludes_en: lines(fd, "excludes_en"),
    duration_hours: int(fd, "duration_hours"),
    price: int(fd, "price"),
    capacity: int(fd, "capacity"),
    max_participants: int(fd, "max_participants"),
    is_active: fd.get("is_active") === "on",
  };
  if (!/^[a-z0-9-]+$/.test(pkg.slug)) return { error: "Slug hanya boleh huruf kecil, angka, dan tanda hubung." };
  if (!pkg.title_id) return { error: "Judul (ID) wajib diisi." };
  if (!(CATEGORIES as readonly string[]).includes(pkg.category)) return { error: "Kategori tidak valid." };
  if ([pkg.duration_hours, pkg.price, pkg.capacity, pkg.max_participants].some((n) => !(n > 0))) {
    return { error: "Durasi, harga, kapasitas, dan maks. peserta harus lebih dari 0." };
  }

  const saved = id
    ? await db.from("packages").update(pkg).eq("id", id).select("id").single()
    : await db.from("packages").insert({ ...pkg, created_by: user!.id }).select("id").single();
  if (saved.error) return { error: saved.error.code === "23505" ? "Slug sudah dipakai." : saved.error.message };
  const pkgId = saved.data.id as string;

  // Itinerary: replace all rows.
  const times = fd.getAll("it_time").map(String);
  const rows = times
    .map((time_label, i) => ({
      package_id: pkgId,
      sort_order: i,
      time_label: time_label.trim(),
      title_id: String(fd.getAll("it_title_id")[i] ?? "").trim(),
      title_en: String(fd.getAll("it_title_en")[i] ?? "").trim(),
      desc_id: String(fd.getAll("it_desc_id")[i] ?? "").trim(),
      desc_en: String(fd.getAll("it_desc_en")[i] ?? "").trim(),
    }))
    .filter((r) => r.title_id);
  await db.from("package_itinerary").delete().eq("package_id", pkgId);
  if (rows.length) await db.from("package_itinerary").insert(rows);

  // Images: remove ticked, upload new.
  const remove = fd.getAll("remove_image").map(String);
  if (remove.length) await db.from("package_images").delete().in("id", remove).eq("package_id", pkgId);

  const files = fd.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  const { count } = await db.from("package_images").select("id", { count: "exact", head: true }).eq("package_id", pkgId);
  for (const [i, file] of files.entries()) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return { error: `${file.name}: harus gambar maks. 5MB.` };
    const path = `${pkgId}/${randomUUID()}.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
    const up = await db.storage.from("package-images").upload(path, file, { contentType: file.type });
    if (up.error) return { error: up.error.message };
    const url = db.storage.from("package-images").getPublicUrl(path).data.publicUrl;
    await db.from("package_images").insert({ package_id: pkgId, image_url: url, sort_order: (count ?? 0) + i });
  }

  // Cover = first gallery image.
  const { data: first } = await db
    .from("package_images").select("image_url").eq("package_id", pkgId).order("sort_order").limit(1).maybeSingle();
  await db.from("packages").update({ cover_image_url: first?.image_url ?? null }).eq("id", pkgId);

  revalidatePath("/", "layout");
  redirect("/admin/packages");
}

export async function setAvailability(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const date = str(fd, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Tanggal tidak valid." };
  const { error } = await createAdminClient()
    .from("availability")
    .upsert(
      { package_id: str(fd, "package_id"), date, slots_total: Math.max(0, int(fd, "slots_total")), is_blocked: fd.get("is_blocked") === "on" },
      { onConflict: "package_id,date" },
    );
  if (error) return { error: error.code === "23514" ? "Slot tidak boleh lebih kecil dari jumlah booking yang sudah ada." : error.message };
  revalidatePath("/admin/availability");
  return { ok: "Tersimpan." };
}

export async function updateBookingStatus(fd: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const id = str(fd, "id");
  const action = str(fd, "action");

  if (action === "confirm") {
    const { data } = await db.from("bookings").update({ status: "confirmed" }).eq("id", id).eq("status", "paid").select("id").maybeSingle();
    if (data) after(() => notifyBooking(id, "booking_confirmed"));
  } else if (action === "reject") {
    const { data: released } = await db.rpc("release_booking", { p_booking: id });
    if (released) after(() => notifyBooking(id, "booking_cancelled"));
  } else if (action === "complete") {
    await db.from("bookings").update({ status: "completed" }).eq("id", id).eq("status", "confirmed");
  }
  revalidatePath("/admin", "layout");
}
