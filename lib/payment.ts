import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckout } from "@/lib/doku";
import type { Profile } from "@/lib/auth";

// Opens a DOKU checkout for a pending booking and records the pending payment. Returns the payment URL.
export async function startPayment(
  booking: { id: string; booking_code: string; total_price: number },
  profile: Profile,
) {
  const { requestId, url } = await createCheckout({
    invoice: booking.booking_code,
    amount: booking.total_price,
    callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${booking.booking_code}`,
    customer: { id: profile.id, name: profile.full_name, email: profile.email, phone: profile.phone },
  });
  const { error } = await createAdminClient().from("payments").insert({
    booking_id: booking.id,
    doku_transaction_id: requestId,
    amount: booking.total_price,
    payment_url: url,
  });
  if (error) throw error;
  return url;
}
