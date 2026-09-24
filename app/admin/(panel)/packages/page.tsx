import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatIDR } from "@/lib/format";
import type { Pkg } from "@/lib/packages";

export const metadata = { title: "Paket" };

export default async function AdminPackages() {
  const { data } = await createAdminClient().from("packages").select("*").order("created_at");
  const packages = (data ?? []) as Pkg[];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Paket tour</h1>
        <Link href="/admin/packages/new" className="btn">Tambah paket</Link>
      </div>
      {packages.length === 0 ? (
        <p className="mt-10 text-muted">Belum ada paket. Klik &ldquo;Tambah paket&rdquo; untuk mulai.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {packages.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/packages/${p.id}`} className="card flex items-center gap-4 p-3 transition hover:border-accent">
                {p.cover_image_url
                  ? <img src={p.cover_image_url} alt="" className="h-14 w-20 shrink-0 rounded-[10px] object-cover" />
                  : <div className="h-14 w-20 shrink-0 rounded-[10px] bg-line" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title_id}</p>
                  <p className="truncate text-sm text-muted">{p.title_en || "Belum ada judul EN"} | /{p.slug}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{formatIDR(p.price)}</p>
                  <p className={p.is_active ? "text-accent" : "text-muted"}>{p.is_active ? "Aktif" : "Nonaktif"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
