import { createClient } from "@/lib/supabase/server";
import { todayWITA } from "@/lib/format";

export type Pkg = {
  id: string; slug: string; destination: string; duration_days: number;
  title_id: string; title_en: string; description_id: string; description_en: string;
  includes_id: string[]; includes_en: string[]; excludes_id: string[]; excludes_en: string[];
  price: number; capacity: number; max_participants: number;
  rating: number | null; review_count: number | null;
  cover_image_url: string | null; is_active: boolean; created_at: string;
};

export const CATS = ["all", "bali", "komodo", "day", "multi"] as const;
export const BANDS = ["all", "low", "mid", "high"] as const;
export const SORTS = ["popular", "low", "high", "rating"] as const;
export type Cat = (typeof CATS)[number];

export function matchCat(p: Pkg, cat: string) {
  if (cat === "bali") return p.destination === "Bali";
  if (cat === "komodo") return p.destination === "Labuan Bajo";
  if (cat === "day") return p.duration_days === 1;
  if (cat === "multi") return p.duration_days > 1;
  return true;
}
export function matchBand(p: Pkg, band: string) {
  if (band === "low") return p.price < 5_000_000;
  if (band === "mid") return p.price >= 5_000_000 && p.price <= 15_000_000;
  if (band === "high") return p.price > 15_000_000;
  return true;
}
export const sorters: Record<string, (a: Pkg, b: Pkg) => number> = {
  popular: (a, b) => (b.review_count ?? 0) - (a.review_count ?? 0),
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
};

// ponytail: whole active catalogue in one query, filtered in JS; fine for a single vendor's dozens of packages
export async function getActivePackages() {
  const supabase = await createClient();
  const { data } = await supabase.from("packages").select("*").eq("is_active", true).order("created_at");
  return (data ?? []) as Pkg[];
}

export async function getPackageBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("packages")
    .select("*, package_itinerary(*), package_images(*)")
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "package_itinerary" })
    .order("sort_order", { referencedTable: "package_images" })
    .maybeSingle();
  return data as (Pkg & {
    package_itinerary: { id: string; time_label: string; title_id: string; title_en: string; desc_id: string; desc_en: string }[];
    package_images: { id: string; image_url: string }[];
  }) | null;
}

// Dates (from tomorrow on) that are blocked or fully booked.
export async function getUnavailableDates(packageId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("date, is_blocked, slots_total, slots_booked")
    .eq("package_id", packageId)
    .gte("date", todayWITA(1));
  return (data ?? []).filter((a) => a.is_blocked || a.slots_booked >= a.slots_total).map((a) => a.date as string);
}
