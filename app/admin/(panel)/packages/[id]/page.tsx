import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PackageForm } from "@/components/PackageForm";
import { savePackage } from "@/app/admin/actions";

export const metadata = { title: "Edit paket" };

export default async function EditPackage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{pkg ? "Edit paket" : "Tambah paket"}</h1>
      <PackageForm action={savePackage} pkg={pkg} />
    </div>
  );
}
