import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n";
import { PackageForm } from "@/components/PackageForm";
import { savePackage } from "@/app/admin/actions";

export const metadata = { title: "Edit package" };

const KEYS = ["source_id", "english_preview", "auto_translate", "f_title", "f_desc", "f_included", "f_excluded", "f_one_per_line", "th_price",
  "f_days", "th_dest", "f_photos", "drop_photos", "remove", "tr_empty_title", "tr_empty_desc", "tr_done", "tr_edit_note", "tr_failed", "edit",
  "f_slug", "f_capacity", "f_max", "f_rating", "f_reviews", "f_active", "f_itinerary", "add_step", "cancel", "save_both"] as const;

export default async function EditPackage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getT();
  let pkg = null;
  if (id !== "new") {
    const { data } = await createAdminClient()
      .from("packages")
      .select("*, package_itinerary(*), package_images(*)")
      .eq("id", id)
      .order("sort_order", { referencedTable: "package_itinerary" })
      .order("sort_order", { referencedTable: "package_images" })
      .maybeSingle();
    if (!data) notFound();
    pkg = data;
  }
  return (
    <div>
      <Link href="/admin/packages" className="text-[13.5px] text-admin-muted hover:text-accent">&larr; {t("manage_packages")}</Link>
      <h1 className="mt-2.5 text-2xl font-bold">{pkg ? t("edit_package") : t("new_package")}</h1>
      <PackageForm action={savePackage} pkg={pkg} s={Object.fromEntries(KEYS.map((k) => [k, t(k)]))} />
    </div>
  );
}
