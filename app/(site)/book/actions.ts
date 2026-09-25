"use server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT, type DictKey } from "@/lib/i18n";
import { notifyBooking } from "@/lib/notify";
import { startPayment } from "@/lib/payment";
import { PAY_METHODS, type PayGroup } from "@/lib/doku";
import type { FormState } from "@/components/ActionForm";

const RPC_ERRORS = ["DATE_FULL", "DATE_INVALID", "PARTICIPANTS_INVALID", "PICKUP_REQUIRED", "PACKAGE_NOT_FOUND"];

// Step 1: hold the date (anti double-booking RPC), then go to the payment step.
export async function createBooking(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login");

  const date = String(fd.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: t("pick_date_first") };

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
  redirect(`/booking/${booking.booking_code}/pay`);
}

// Step 2: open a DOKU checkout limited to the chosen method, and hand the customer over to it.
export async function payBooking(_: FormState, fd: FormData): Promise<FormState> {
  const { t } = await getT();
  const { supabase, profile } = await getSession();
  if (!profile) redirect("/login");

  const code = String(fd.get("code"));
  const group = String(fd.get("method")) as PayGroup;
  const methods = PAY_METHODS[group] as Record<string, string> | undefined;
  if (!methods) return { error: t("err_generic") };
  const sub = String(fd.get(group === "va" ? "bank" : group === "ewallet" ? "wallet" : "") ?? "");
  const methodTypes = sub in methods ? [sub] : Object.keys(methods);

  const { data: booking } = await supabase
    .from("bookings").select("id, booking_code, total_price").eq("booking_code", code).eq("status", "pending").maybeSingle();
  if (!booking) redirect(`/booking/${code}`);

  let url: string;
  try {
    url = await startPayment(booking, profile, methodTypes);
  } catch (e) {
    console.error(e);
    return { error: t("err_PAYMENT") };
  }
  redirect(url);
}
