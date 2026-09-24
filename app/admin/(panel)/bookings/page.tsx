import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatIDR, STATUS_LABEL } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Booking" };


export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  let q = createAdminClient()
    .from("bookings")
    .select("id, booking_code, booking_date, status, total_price, created_at, profiles(full_name), packages(title_id)")
    .order("created_at", { ascending: false })
    .limit(200); // ponytail: no pagination yet, add when a filter shows >200 rows
  if (status && status in STATUS_LABEL) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as unknown as {
    id: string; booking_code: string; booking_date: string; status: string; total_price: number;
    profiles: { full_name: string }; packages: { title_id: string };
  }[];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Booking &amp; pembayaran</h1>
      <nav className="mt-6 flex flex-wrap gap-2 text-sm">
        {[["", "Semua"], ...Object.entries(STATUS_LABEL)].map(([s, label]) => (
          <Link key={s} href={s ? `?status=${s}` : "?"}
            className={`rounded-full px-3 py-1.5 ${(status ?? "") === s ? "bg-accent text-accent-fg" : "border border-line hover:bg-accent-soft"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-10 text-muted">Tidak ada booking untuk filter ini.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                {["Kode", "Pelanggan", "Paket", "Tanggal tour", "Total", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-accent-soft/50">
                  <td className="px-4 py-3 font-semibold"><Link href={`/admin/bookings/${b.id}`} className="text-accent">{b.booking_code}</Link></td>
                  <td className="px-4 py-3">{b.profiles.full_name}</td>
                  <td className="px-4 py-3">{b.packages.title_id}</td>
                  <td className="px-4 py-3">{formatDate(b.booking_date, "id")}</td>
                  <td className="px-4 py-3 tabular-nums">{formatIDR(b.total_price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} label={STATUS_LABEL[b.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
