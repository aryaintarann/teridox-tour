import { createAdminClient } from "@/lib/supabase/admin";
import { formatIDR, isLocalPhone, todayWITA } from "@/lib/format";

export const metadata = { title: "Laporan" };

const REVENUE = ["paid", "confirmed", "completed"];

export default async function Reports({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const from = sp.from || todayWITA().slice(0, 8) + "01";
  const to = sp.to || todayWITA();

  // ponytail: aggregates in JS; move to a SQL view when bookings reach tens of thousands per period
  const { data } = await createAdminClient()
    .from("bookings")
    .select("status, total_price, profiles(phone)")
    .gte("created_at", `${from}T00:00:00+08:00`)
    .lte("created_at", `${to}T23:59:59+08:00`)
    .neq("status", "cancelled");

  const rows = (data ?? []) as unknown as { status: string; total_price: number; profiles: { phone: string } }[];
  const paid = rows.filter((r) => REVENUE.includes(r.status));
  const revenue = paid.reduce((s, r) => s + r.total_price, 0);
  const local = paid.filter((r) => isLocalPhone(r.profiles.phone)).length;
  const foreign = paid.length - local;
  const pct = (n: number) => (paid.length ? Math.round((n / paid.length) * 100) : 0);

  const stats = [
    ["Total booking", String(rows.length), "Tidak termasuk yang dibatalkan"],
    ["Pendapatan", formatIDR(revenue), `${paid.length} booking terbayar`],
    ["Wisatawan lokal", String(local), `${pct(local)}% dari booking terbayar`],
    ["Wisatawan asing", String(foreign), `${pct(foreign)}% dari booking terbayar`],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Laporan ringkas</h1>
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5"><span className="label">Dari</span><input type="date" name="from" defaultValue={from} className="input" /></label>
        <label className="grid gap-1.5"><span className="label">Sampai</span><input type="date" name="to" defaultValue={to} className="input" /></label>
        <button className="btn">Tampilkan</button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Lokal/asing ditentukan dari nomor telepon pelanggan (awalan +62 atau 0 = lokal).</p>
    </div>
  );
}
