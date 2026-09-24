import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, todayWITA } from "@/lib/format";
import { Calendar } from "@/components/Calendar";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { setAvailability } from "@/app/admin/actions";

export const metadata = { title: "Ketersediaan" };

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ package?: string; date?: string }> }) {
  const sp = await searchParams;
  const db = createAdminClient();
  const { data: packages } = await db.from("packages").select("id, title_id, capacity").order("created_at");
  const pkg = packages?.find((p) => p.id === sp.package) ?? packages?.[0];
  if (!pkg) return <p className="text-muted">Tambahkan paket terlebih dahulu.</p>;

  const { data: rows } = await db
    .from("availability").select("date, is_blocked, slots_total, slots_booked").eq("package_id", pkg.id).gte("date", todayWITA());
  const labels: Record<string, string> = {};
  const unavailable: string[] = [];
  for (const r of rows ?? []) {
    labels[r.date] = r.is_blocked ? "libur" : `${r.slots_booked}/${r.slots_total}`;
    if (r.is_blocked || r.slots_booked >= r.slots_total) unavailable.push(r.date);
  }
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : null;
  const current = rows?.find((r) => r.date === date);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">Kelola ketersediaan</h1>
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5">
          <span className="label">Paket</span>
          <select name="package" defaultValue={pkg.id} className="input">
            {packages!.map((p) => <option key={p.id} value={p.id}>{p.title_id}</option>)}
          </select>
        </label>
        <button className="btn-ghost">Pilih</button>
      </form>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="card p-5">
          <Calendar lang="id" minDate={todayWITA()} unavailable={unavailable} labels={labels}
            selected={date ?? undefined} linkPrefix={`?package=${pkg.id}&date=`} />
          <p className="mt-3 text-xs text-muted">
            Angka = terpesan/total mobil. Tanggal tanpa angka memakai kapasitas default ({pkg.capacity} mobil). Klik tanggal untuk mengubah.
          </p>
        </div>

        {date ? (
          <div className="card h-fit p-5">
            <h2 className="font-semibold">{formatDate(date, "id")}</h2>
            <p className="mt-1 text-sm text-muted">Terpesan: {current?.slots_booked ?? 0}</p>
            <ActionForm action={setAvailability} className="mt-4 grid gap-4">
              <input type="hidden" name="package_id" value={pkg.id} />
              <input type="hidden" name="date" value={date} />
              <label className="grid gap-2">
                <span className="label">Jumlah mobil tersedia</span>
                <input type="number" name="slots_total" min={0} defaultValue={current?.slots_total ?? pkg.capacity} className="input" required />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_blocked" defaultChecked={current?.is_blocked ?? false} className="h-4 w-4" />
                <span className="label">Blokir tanggal (libur / penuh)</span>
              </label>
              <SubmitButton>Simpan</SubmitButton>
            </ActionForm>
          </div>
        ) : (
          <p className="text-sm text-muted">Pilih tanggal di kalender untuk mengatur slot atau memblokirnya.</p>
        )}
      </div>
    </div>
  );
}
