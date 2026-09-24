import { createClient } from "@/lib/supabase/server";
import { todayWITA } from "@/lib/format";

export type Pkg = {
  id: string; slug: string; category: string;
  title_id: string; title_en: string; description_id: string; description_en: string;
  includes_id: string[]; includes_en: string[]; excludes_id: string[]; excludes_en: string[];
  duration_hours: number; price: number; capacity: number; max_participants: number;
  cover_image_url: string | null; is_active: boolean;
};

export const CATEGORIES = ["tour", "transfer", "rental"] as const;

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
