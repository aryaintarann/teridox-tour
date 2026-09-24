"use server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT, type DictKey } from "@/lib/i18n";
import { notifyBooking } from "@/lib/notify";
import { startPayment } from "@/lib/payment";
import type { FormState } from "@/components/ActionForm";

const RPC_ERRORS = ["DATE_FULL", "DATE_INVALID", "PARTICIPANTS_INVALID", "PICKUP_REQUIRED", "PACKAGE_NOT_FOUND"];

export async function createBooking(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login");

  const date = String(fd.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: t("err_DATE_INVALID") };

  const { data: booking, error } = await supabase.rpc("create_booking", {
    p_package: String(fd.get("package_id")),
    p_date: date,
    p_participants: Number(fd.get("participants")),
    p_pickup: String(fd.get("pickup") ?? ""),
    p_notes: String(fd.get("notes") ?? ""),
  });
  if (error || !booking) {
    const code = RPC_ERRORS.find((c) => error?.message.includes(c));
    return { error: code ? t(`err_${code}` as DictKey) : t("err_generic") };
  }

  after(() => notifyBooking(booking.id, "booking_created"));

  let url: string;
  try {
    url = await startPayment(booking, profile);
  } catch (e) {
    console.error(e);
    redirect(`/booking/${booking.booking_code}?payment_error=1`);
  }
  redirect(url);
}

export async function payBooking(fd: FormData) {
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login");
  const code = String(fd.get("code"));
  const { data: booking } = await supabase
    .from("bookings").select("id, booking_code, total_price").eq("booking_code", code).eq("status", "pending").single();
  if (!booking) redirect(`/booking/${code}`);

  let url: string;
  try {
    url = await startPayment(booking, profile);
  } catch (e) {
    console.error(e);
    redirect(`/booking/${code}?payment_error=1`);
  }
  redirect(url);
}
