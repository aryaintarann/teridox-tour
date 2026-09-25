"use client";
import { useActionState } from "react";

export type FormState = {
  error?: string;
  ok?: string;
  fields?: Record<string, string>; // per-field errors
  values?: Record<string, string>; // echoed back so inputs keep their text after a failed submit
} | null;

export function ActionForm({ action, children, className = "grid gap-4" }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-medium text-ok">{state.ok}</p>}
    </form>
  );
}
