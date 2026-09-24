import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/app/actions";

export const metadata = { title: { default: "Admin", template: "%s | Admin TeridoxTour" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  // "New booking" notification = paid, waiting for vendor confirmation.
  const { count } = await createAdminClient().from("bookings").select("id", { count: "exact", head: true }).eq("status", "paid");

  const nav = [
    ["/admin", "Laporan"],
    ["/admin/bookings", "Booking"],
    ["/admin/packages", "Paket"],
    ["/admin/availability", "Ketersediaan"],
  ] as const;

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-surface md:min-h-[100dvh] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <Link href="/admin" className="font-bold">Teridox<span className="text-accent">Tour</span></Link>
          <p className="hidden text-xs text-muted md:mt-1 md:block">{profile?.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 text-sm md:flex-col">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="flex items-center justify-between whitespace-nowrap rounded-[10px] px-3 py-2 hover:bg-accent-soft">
              {label}
              {href === "/admin/bookings" && !!count && (
                <span className="ml-2 rounded-full bg-accent px-2 text-xs font-semibold text-accent-fg">{count}</span>
              )}
            </Link>
          ))}
          <Link href="/" className="whitespace-nowrap rounded-[10px] px-3 py-2 text-muted hover:bg-accent-soft">Lihat situs</Link>
          <form action={signOut}>
            <button className="w-full whitespace-nowrap rounded-[10px] px-3 py-2 text-left text-muted hover:bg-accent-soft">Keluar</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
