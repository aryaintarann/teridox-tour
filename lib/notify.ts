// Email (Resend) + WhatsApp (Fonnte) notifications. Missing keys => channel skipped, never throws.
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatIDR, isLocalPhone, toWaNumber } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

export type NotifyType = "booking_created" | "payment_success" | "booking_confirmed" | "booking_cancelled" | "reminder";

const copy: Record<Lang, Record<NotifyType, { subject: string; lead: string }>> = {
  id: {
    booking_created: { subject: "Booking diterima", lead: "Booking Anda sudah kami terima. Selesaikan pembayaran dalam 60 menit." },
    payment_success: { subject: "Pembayaran berhasil", lead: "Pembayaran Anda berhasil. Vendor akan segera mengonfirmasi." },
    booking_confirmed: { subject: "Booking dikonfirmasi", lead: "Booking Anda sudah dikonfirmasi vendor. Sampai jumpa!" },
    booking_cancelled: { subject: "Booking dibatalkan", lead: "Maaf, booking Anda dibatalkan. Vendor akan menghubungi Anda terkait pengembalian dana." },
    reminder: { subject: "Pengingat: tour Anda besok", lead: "Pengingat: tour Anda dijadwalkan besok. Sopir akan menjemput di lokasi yang Anda isi." },
  },
  en: {
    booking_created: { subject: "Booking received", lead: "We received your booking. Please complete payment within 60 minutes." },
    payment_success: { subject: "Payment successful", lead: "Your payment went through. The vendor will confirm shortly." },
    booking_confirmed: { subject: "Booking confirmed", lead: "The vendor confirmed your booking. See you soon!" },
    booking_cancelled: { subject: "Booking cancelled", lead: "Sorry, your booking was cancelled. The vendor will contact you about the refund." },
    reminder: { subject: "Reminder: your tour is tomorrow", lead: "Reminder: your tour is tomorrow. Your driver will pick you up at the location you gave." },
  },
};

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !to) return "skipped";
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.EMAIL_FROM, to, subject, text });
  return error ? `failed: ${error.message}` : "sent";
}

async function sendWa(phone: string, message: string) {
  if (!process.env.FONNTE_TOKEN || !phone) return "skipped";
  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: process.env.FONNTE_TOKEN },
    body: new URLSearchParams({ target: toWaNumber(phone), message }),
  });
  return res.ok ? "sent" : `failed: ${res.status}`;
}

export async function notifyBooking(bookingId: string, type: NotifyType) {
  const db = createAdminClient();
  const { data: b } = await db
    .from("bookings")
    .select("*, profiles(full_name, email, phone, preferred_lang), packages(title_id, title_en)")
    .eq("id", bookingId)
    .single();
  if (!b) return;

  const lang: Lang = b.profiles.preferred_lang === "en" ? "en" : "id";
  const { subject, lead } = copy[lang][type];
  const title = (lang === "en" && b.packages.title_en) || b.packages.title_id;
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${b.booking_code}`;
  const text = [
    `${lang === "en" ? "Hi" : "Halo"} ${b.profiles.full_name},`,
    "",
    lead,
    "",
    `${b.booking_code} | ${title}`,
    `${formatDate(b.booking_date, lang)} | ${b.participants} pax | ${formatIDR(b.total_price)}`,
    `${lang === "en" ? "Pickup" : "Jemput"}: ${b.pickup_location}`,
    "",
    link,
  ].join("\n");

  const log: { booking_id: string; channel: "email" | "wa"; type: string; status: string }[] = [];
  const run = async (channel: "email" | "wa", p: Promise<string>, t: string = type) => {
    const status = await p.catch((e: Error) => `failed: ${e.message}`);
    log.push({ booking_id: b.id, channel, type: t, status });
  };

  const tasks = [run("email", sendEmail(b.profiles.email, `${subject} - ${b.booking_code}`, text))];
  // PRD §8: WhatsApp for the local market only.
  if (["booking_created", "reminder"].includes(type) && isLocalPhone(b.profiles.phone)) {
    tasks.push(run("wa", sendWa(b.profiles.phone, `*TeridoxTour*\n\n${text}`)));
  }
  if (type === "payment_success") {
    const adminText = `Booking baru dibayar: ${b.booking_code}\n${title}\n${formatDate(b.booking_date, "id")}\n${b.profiles.full_name} (${b.profiles.phone})\n${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${b.id}`;
    tasks.push(run("email", sendEmail(process.env.ADMIN_EMAIL ?? "", `[Admin] ${b.booking_code} dibayar`, adminText), "admin_payment_success"));
    tasks.push(run("wa", sendWa(process.env.NEXT_PUBLIC_VENDOR_WA ?? "", adminText), "admin_payment_success"));
  }
  await Promise.all(tasks);
  await db.from("notifications_log").insert(log.filter((l) => l.status !== "skipped"));
}
