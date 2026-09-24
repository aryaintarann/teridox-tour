"use client";
import { useActionState, useState } from "react";
import { Calendar } from "@/components/Calendar";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/components/ActionForm";

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  lang: "id" | "en";
  packageId: string;
  maxParticipants: number;
  minDate: string;
  unavailable: string[];
  priceText: string;
  s: Record<"pick_date" | "participants" | "pickup" | "pickup_hint" | "notes" | "summary" | "total" | "per_booking" | "continue_pay" | "people", string>;
};

export function BookingForm({ action, lang, packageId, maxParticipants, minDate, unavailable, priceText, s }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [pax, setPax] = useState(1);

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="package_id" value={packageId} />
      <div className="grid gap-6">
        <fieldset className="card p-5">
          <legend className="label px-1">{s.pick_date}</legend>
          <Calendar lang={lang} minDate={minDate} unavailable={unavailable} name="date" />
        </fieldset>
        <label className="grid gap-2">
          <span className="label">{s.participants}</span>
          <input name="participants" type="number" min={1} max={maxParticipants} value={pax}
            onChange={(e) => setPax(Number(e.target.value))} className="input max-w-40" required />
        </label>
        <label className="grid gap-2">
          <span className="label">{s.pickup}</span>
          <input name="pickup" className="input" placeholder={s.pickup_hint} maxLength={300} required />
        </label>
        <label className="grid gap-2">
          <span className="label">{s.notes}</span>
          <textarea name="notes" rows={3} maxLength={1000} className="input" />
        </label>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="font-semibold">{s.summary}</h2>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">1 {s.per_booking}</dt><dd>{priceText}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{s.participants}</dt><dd>{pax} {s.people}</dd></div>
          <div className="mt-2 flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>{s.total}</dt><dd>{priceText}</dd>
          </div>
        </dl>
        {state?.error && <p role="alert" className="mt-4 text-sm font-medium text-danger">{state.error}</p>}
        <SubmitButton className="btn mt-6 w-full !py-3">{s.continue_pay}</SubmitButton>
      </aside>
    </form>
  );
}
