"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/components/ActionForm";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

function Input({ label, name, state, aside, ...props }: {
  label: string; name: string; state: FormState; aside?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const err = state?.fields?.[name];
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="label">{label}</label>
        {aside}
      </div>
      <input id={name} name={name} defaultValue={state?.values?.[name]} aria-invalid={!!err}
        aria-describedby={err ? `${name}-err` : undefined}
        className={`input ${err ? "!border-danger" : ""}`} {...props} />
      {err && <p id={`${name}-err`} className="field-error">{err}</p>}
    </div>
  );
}

export function RegisterForm({ action, next, s }: {
  action: Action; next: string;
  s: Record<"full_name" | "email" | "phone" | "password" | "confirm_password" | "agree" | "create_account", string>;
}) {
  const [state, formAction] = useActionState(action, null);
  const [agree, setAgree] = useState(false);
  return (
    <form action={formAction} key={JSON.stringify(state?.values)} className="mt-8 flex max-w-[440px] flex-col gap-[18px]" noValidate>
      <input type="hidden" name="next" value={next} />
      <Input label={s.full_name} name="full_name" state={state} autoComplete="name" placeholder="Arya Ramadhan" />
      <Input label={s.email} name="email" type="email" state={state} autoComplete="email" placeholder="arya@email.com" />
      <Input label={s.phone} name="phone" type="tel" state={state} autoComplete="tel" placeholder="+62 812 3456 7890" />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input label={s.password} name="password" type="password" state={state} autoComplete="new-password" placeholder="••••••••" />
        <Input label={s.confirm_password} name="password2" type="password" state={state} autoComplete="new-password" placeholder="••••••••" />
      </div>
      <label className="mt-1 flex cursor-pointer items-start gap-[11px]">
        <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="peer sr-only" />
        <span className={`mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 ${
          agree ? "border-accent bg-accent text-white" : "border-[#d4ccc0] bg-surface text-transparent"}`}>
          <Check size={12} weight="bold" />
        </span>
        <span className="text-[13.5px] leading-normal text-ink-3">{s.agree}</span>
      </label>
      {state?.fields?.agree && <p className="field-error -mt-3">{state.fields.agree}</p>}
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-medium text-ok">{state.ok}</p>}
      <SubmitButton className="btn-dark mt-1.5">{s.create_account}</SubmitButton>
    </form>
  );
}

export function LoginForm({ action, next, s }: {
  action: Action; next: string; s: Record<"email" | "password" | "forgot" | "login", string>;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} key={JSON.stringify(state?.values)} className="flex flex-col gap-[18px]" noValidate>
      <input type="hidden" name="next" value={next} />
      <Input label={s.email} name="email" type="email" state={state} autoComplete="email" placeholder="arya@email.com" />
      <Input label={s.password} name="password" type="password" state={state} autoComplete="current-password" placeholder="••••••••"
        aside={<Link href="/forgot-password" className="mb-[7px] text-[13px] text-accent-text">{s.forgot}</Link>} />
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      <SubmitButton className="btn-dark">{s.login}</SubmitButton>
    </form>
  );
}
