import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBooking } from "@/lib/notify";
import { todayWITA } from "@/lib/format";

// Vercel Cron (vercel.json), daily 09:00 WITA: expire stale holds + send H-1 reminders.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const db = createAdminClient();
  const { data: expired } = await db.rpc("expire_pending_bookings");

  // Claim rows first (reminder_sent_at) so a re-run never sends twice.
  const { data: due } = await db
    .from("bookings")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("booking_date", todayWITA(1))
    .in("status", ["paid", "confirmed"])
    .is("reminder_sent_at", null)
    .select("id");

  for (const b of due ?? []) await notifyBooking(b.id, "reminder");
  return Response.json({ expired, reminders: due?.length ?? 0 });
}
