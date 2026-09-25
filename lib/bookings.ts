import { getSession } from "@/lib/auth";

export type MyBooking = {
  id: string; booking_code: string; booking_date: string; participants: number; pickup_location: string; notes: string | null;
  status: "pending" | "paid" | "confirmed" | "cancelled" | "completed";
  subtotal: number | null; service_fee: number | null; tax: number | null; total_price: number;
  created_at: string; paid_at: string | null; confirmed_at: string | null; completed_at: string | null; cancelled_at: string | null;
  packages: { slug: string; title_id: string; title_en: string; destination: string; duration_days: number; cover_image_url: string | null };
  payments: { status: string; method: string | null; doku_transaction_id: string; amount: number; created_at: string; updated_at: string }[];
};

// RLS: customers only ever see their own bookings.
export async function getMyBooking(code: string) {
  const { supabase, profile } = await getSession();
  const { data } = await supabase
    .from("bookings")
    .select("*, packages(slug, title_id, title_en, destination, duration_days, cover_image_url), payments(status, method, doku_transaction_id, amount, created_at, updated_at)")
    .eq("booking_code", code)
    .order("created_at", { referencedTable: "payments", ascending: false })
    .maybeSingle();
  return { booking: data as MyBooking | null, profile };
}

export const invoiceNo = (b: Pick<MyBooking, "created_at" | "booking_code">) =>
  `INV/${b.created_at.slice(0, 4)}/${b.created_at.slice(5, 7)}/${b.booking_code.replace("TDX-", "")}`;
