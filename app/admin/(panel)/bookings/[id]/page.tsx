import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatIDR, STATUS_LABEL, toWaNumber } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { updateBookingStatus } from "@/app/admin/actions";

export const metadata = { title: "Detail booking" };

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: b } = await createAdminClient()
    .from("bookings")
    .select("*, profiles(full_name, email, phone, preferred_lang), packages(title_id), payments(*), notifications_log(channel, type, status, sent_at)")
    .eq("id", id)
    .order("created_at", { referencedTable: "payments", ascending: false })
    .maybeSingle();
  if (!b) notFound();

  const paidPayment = b.payments.find((p: { status: string }) => p.status === "success");
  const rows: [string, string][] = [
    ["Paket", b.packages.title_id],
    ["Tanggal tour", formatDate(b.booking_date, "id")],
    ["Peserta", `${b.participants} orang`],
    ["Lokasi jemput", b.pickup_location],
    ["Catatan", b.notes ?? "-"],
    ["Pelanggan", `${b.profiles.full_name} (${b.profiles.preferred_lang.toUpperCase()})`],
    ["Email", b.profiles.email],
    ["Telepon", b.profiles.phone],
    ["Total", formatIDR(b.total_price)],
  ];

  const action = (value: string, label: string, ghost = false) => (
    <form action={updateBookingStatus}>
      <input type="hidden" name="id" value={b.id} />
      <input type="hidden" name="action" value={value} />
      <SubmitButton className={ghost ? "btn-ghost !text-danger" : "btn"}>{label}</SubmitButton>
    </form>
  );

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bookings" className="text-sm text-accent">&larr; Semua booking</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{b.booking_code}</h1>
        <StatusBadge status={b.status} label={STATUS_LABEL[b.status]} />
      </div>

      {b.status === "cancelled" && paidPayment && (
        <p role="alert" className="mt-4 rounded-[10px] bg-danger/10 p-3 text-sm text-danger">
          Booking dibatalkan tetapi pembayaran berhasil. Lakukan refund manual lewat DOKU Back Office atau hubungi pelanggan.
        </p>
      )}

      <dl className="card mt-6 grid gap-3 p-6 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[130px_1fr] gap-4"><dt className="text-muted">{k}</dt><dd className="break-words">{v}</dd></div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {b.status === "paid" && action("confirm", "Konfirmasi booking")}
        {b.status === "confirmed" && action("complete", "Tandai selesai")}
        {["pending", "paid", "confirmed"].includes(b.status) && action("reject", "Tolak / batalkan", true)}
        <a href={`https://wa.me/${toWaNumber(b.profiles.phone)}`} target="_blank" rel="noopener" className="btn-ghost">WhatsApp pelanggan</a>
      </div>
      {["paid", "confirmed"].includes(b.status) && (
        <p className="mt-2 text-xs text-muted">Menolak booking yang sudah dibayar tidak otomatis mengembalikan dana. Refund dilakukan manual di DOKU.</p>
      )}

      <h2 className="mb-3 mt-10 text-lg font-semibold">Transaksi DOKU</h2>
      {b.payments.length === 0 ? <p className="text-sm text-muted">Belum ada transaksi.</p> : (
        <div className="grid gap-3">
          {b.payments.map((p: { id: string; doku_transaction_id: string; status: string; method: string | null; amount: number; created_at: string; raw_payload: unknown }) => (
            <details key={p.id} className="card p-4 text-sm">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                <StatusBadge status={p.status} label={p.status} />
                <span className="tabular-nums">{formatIDR(p.amount)}</span>
                <span className="text-muted">{p.method ?? "-"}</span>
                <span className="text-muted">{new Date(p.created_at).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })}</span>
              </summary>
              <p className="mt-3 text-xs text-muted">Request-Id: {p.doku_transaction_id}</p>
              {p.raw_payload != null && (
                <pre className="mt-2 max-h-80 overflow-auto rounded-[10px] bg-bg p-3 text-xs">{JSON.stringify(p.raw_payload, null, 2)}</pre>
              )}
            </details>
          ))}
        </div>
      )}

      <h2 className="mb-3 mt-10 text-lg font-semibold">Notifikasi terkirim</h2>
      {b.notifications_log.length === 0 ? <p className="text-sm text-muted">Belum ada notifikasi.</p> : (
        <ul className="grid gap-1 text-sm">
          {b.notifications_log.map((n: { channel: string; type: string; status: string; sent_at: string }, i: number) => (
            <li key={i} className="text-muted">
              <span className="font-medium text-ink">{n.channel}</span> {n.type}: {n.status} ({new Date(n.sent_at).toLocaleString("id-ID", { timeZone: "Asia/Makassar" })})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
