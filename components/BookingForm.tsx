"use client";
import { useActionState, useState } from "react";
import { Minus, Plus } from "@phosphor-icons/react";
import { Calendar } from "@/components/Calendar";
import { SubmitButton } from "@/components/SubmitButton";
import { priceBreakdown } from "@/lib/pricing";
import type { FormState } from "@/components/ActionForm";

type Keys = "choose_date" | "full_disabled" | "travellers" | "pickup" | "pickup_airport" | "pickup_hotel" | "pickup_port"
  | "notes" | "notes_ph" | "price_summary" | "date" | "service_fee" | "tax" | "total" | "continue_payment" | "secured_by" | "pick_date_first";

const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function BookingForm({ action, lang, packageId, price, maxParticipants, minDate, initialDate, unavailable, header, s }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  lang: "id" | "en";
  packageId: string;
  price: number;
  maxParticipants: number;
  minDate: string;
  initialDate?: string;
  unavailable: string[];
  header: React.ReactNode;
  s: Record<Keys, string>;
}) {
  const [state, formAction] = useActionState(action, null);
  const [date, setDate] = useState(initialDate ?? "");
  const [pax, setPax] = useState(Math.min(2, maxParticipants));
  const p = priceBreakdown(price, pax);
  const dateLabel = date
    ? new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
        .format(new Date(date + "T00:00:00Z"))
    : "-";
  const stepBtn = "flex h-8 w-8 items-center justify-center rounded-[9px] bg-sand transition hover:bg-line disabled:opacity-40";

  return (
    <form action={formAction} className="mt-7 grid items-start gap-10 lg:grid-cols-[1fr_388px]">
      <input type="hidden" name="package_id" value={packageId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="participants" value={pax} />
      <div className="flex flex-col gap-5">
        {header}
        <fieldset className="card p-[26px]">
          <legend className="sr-only">{s.choose_date}</legend>
          <p className="text-[17px] font-bold">{s.choose_date}</p>
          <p className="mt-1 text-[13.5px] text-muted">{s.full_disabled}</p>
          <div className="mt-[18px] max-w-[520px]">
            <Calendar big lang={lang} minDate={minDate} unavailable={unavailable} selected={initialDate} onChange={setDate} />
          </div>
        </fieldset>
        <div className="card grid gap-[22px] p-[26px] sm:grid-cols-2">
          <div>
            <p className="label">{s.travellers}</p>
            <div className="flex w-fit items-center gap-3.5 rounded-xl border border-line-2 px-3.5 py-2">
              <button type="button" aria-label="-1" onClick={() => setPax((n) => Math.max(1, n - 1))} disabled={pax <= 1} className={stepBtn}><Minus size={16} /></button>
              <span className="min-w-[26px] text-center text-[17px] font-bold" aria-live="polite">{pax}</span>
              <button type="button" aria-label="+1" onClick={() => setPax((n) => Math.min(maxParticipants, n + 1))} disabled={pax >= maxParticipants} className={stepBtn}><Plus size={16} /></button>
            </div>
          </div>
          <label className="block">
            <span className="label">{s.pickup}</span>
            <select name="pickup" defaultValue={s.pickup_hotel} className="input !py-[13px]">
              <option>{s.pickup_airport}</option>
              <option>{s.pickup_hotel}</option>
              <option>{s.pickup_port}</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="label">{s.notes}</span>
            <textarea name="notes" maxLength={1000} placeholder={s.notes_ph} className="input h-[84px] resize-none" />
          </label>
        </div>
      </div>

      <aside className="float-card lg:sticky lg:top-[100px]">
        <p className="text-[17px] font-bold">{s.price_summary}</p>
        <dl className="mt-[18px] flex flex-col gap-[13px] text-[14.5px]">
          <Row k={s.date} v={dateLabel} />
          <Row k={`${rp(price)} × ${pax}`} v={rp(p.subtotal)} />
          <Row k={s.service_fee} v={rp(p.fee)} />
          <Row k={s.tax} v={rp(p.tax)} />
        </dl>
        <div className="my-[18px] h-px bg-hair" />
        <p className="flex items-baseline justify-between"><span className="text-[15px] font-bold">{s.total}</span><span className="text-2xl font-bold text-accent-text">{rp(p.total)}</span></p>
        {state?.error && <p role="alert" className="mt-4 text-sm font-medium text-danger">{state.error}</p>}
        <SubmitButton className="mt-[22px] flex w-full justify-center rounded-[14px] bg-accent p-[17px] text-base font-bold text-white transition hover:bg-accent-hover disabled:opacity-60">
          {date ? s.continue_payment : s.pick_date_first}
        </SubmitButton>
        <p className="mt-3 text-center text-[12.5px] text-faint">{s.secured_by}</p>
      </aside>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>;
}
