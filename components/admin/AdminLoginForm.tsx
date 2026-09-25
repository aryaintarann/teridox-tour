"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/components/ActionForm";

const input = "w-full rounded-[10px] border border-[#333a42] bg-console px-[15px] py-[13px] text-[15px] text-white outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export function AdminLoginForm({ action, next, s }: {
  action: (p: FormState, fd: FormData) => Promise<FormState>; next: string; s: { email: string; password: string; enter: string };
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} key={JSON.stringify(state?.values)} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-[7px] block text-[13px] font-semibold text-[#c3cad3]">{s.email}</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} placeholder="admin@teridoxtour.com" className={input} />
      </label>
      <label className="block">
        <span className="mb-[7px] block text-[13px] font-semibold text-[#c3cad3]">{s.password}</span>
        <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={input} />
      </label>
      {state?.error && <p role="alert" className="text-sm font-medium text-[#f97066]">{state.error}</p>}
      <SubmitButton className="rounded-[11px] bg-accent p-[15px] text-[15.5px] font-bold text-white transition hover:bg-accent-hover disabled:opacity-60">{s.enter}</SubmitButton>
    </form>
  );
}
