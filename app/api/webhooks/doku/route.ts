import { after } from "next/server";
import { verify } from "@/lib/doku";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBooking } from "@/lib/notify";

// DOKU HTTP Notification. Set the Notification URL in DOKU Back Office to <site>/api/webhooks/doku.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!process.env.DOKU_SECRET_KEY || !verify(request.headers, raw, "/api/webhooks/doku", process.env.DOKU_SECRET_KEY)) {
    return new Response("invalid signature", { status: 401 });
  }

  const body = JSON.parse(raw);
  // Checkout lets the customer retry another method, so DOKU advises ignoring FAILED.
  if (body?.transaction?.status !== "SUCCESS") return Response.json({ ok: true });

  const db = createAdminClient();
  // Idempotent: only a still-pending row flips; a replayed notification matches nothing.
  const { data: payment } = await db
    .from("payments")
    .update({ status: "success", method: body.channel?.id ?? null, raw_payload: body, updated_at: new Date().toISOString() })
    .eq("doku_transaction_id", body.transaction.original_request_id)
    .eq("status", "pending")
    .eq("amount", Number(body.order?.amount))
    .select("booking_id")
    .maybeSingle();
  if (!payment) return Response.json({ ok: true, duplicate: true });

  const { data: booking } = await db
    .from("bookings").update({ status: "paid" }).eq("id", payment.booking_id).eq("status", "pending").select("id").maybeSingle();

  // A paid booking that already expired stays cancelled; admin sees the successful payment and refunds or rebooks.
  if (booking) after(() => notifyBooking(booking.id, "payment_success"));
  else console.warn("DOKU payment for non-pending booking", payment.booking_id);

  return Response.json({ ok: true });
}
