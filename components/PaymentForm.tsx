"use client";
import { useActionState, useState } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/components/ActionForm";

type Keys = "choose_payment" | "secure_payment" | "pay_card" | "pay_card_desc" | "pay_va" | "pay_va_desc" | "pay_ewallet" | "pay_ewallet_desc"
  | "pay_qris" | "pay_qris_desc" | "choose_bank" | "choose_wallet" | "card_note" | "va_note" | "wallet_note" | "qris_note" | "pay_now";

const GROUPS = [
  ["card", "pay_card", "pay_card_desc", "VISA · MASTERCARD · JCB"],
  ["va", "pay_va", "pay_va_desc", "BCA · MANDIRI · BNI · BRI"],
  ["ewallet", "pay_ewallet", "pay_ewallet_desc", "OVO · SHOPEEPAY"],
  ["qris", "pay_qris", "pay_qris_desc", "QRIS"],
] as const;
const BANKS = [["VIRTUAL_ACCOUNT_BCA", "BCA"], ["VIRTUAL_ACCOUNT_BANK_MANDIRI", "Mandiri"], ["VIRTUAL_ACCOUNT_BNI", "BNI"], ["VIRTUAL_ACCOUNT_BRI", "BRI"]];
const WALLETS = [["EMONEY_OVO", "OVO"], ["EMONEY_SHOPEE_PAY", "ShopeePay"]];

export function PaymentForm({ action, code, summary, s }: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  code: string;
  summary: React.ReactNode;
  s: Record<Keys, string>;
}) {
  const [state, formAction] = useActionState(action, null);
  const [method, setMethod] = useState<(typeof GROUPS)[number][0]>("va");
  const [bank, setBank] = useState(BANKS[0][0]);
  const [wallet, setWallet] = useState(WALLETS[0][0]);

  const chips = (list: string[][], value: string, set: (v: string) => void, name: string) => (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup">
      {list.map(([v, label]) => (
        <label key={v} className={`cursor-pointer rounded-[10px] border px-2 py-[11px] text-center text-[13px] font-semibold transition ${
          value === v ? "border-accent bg-[#fdf3ec] text-accent-deep" : "border-line-2 text-ink-3 hover:border-accent"}`}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => set(v)} className="sr-only" />
          {label}
        </label>
      ))}
    </div>
  );
  const note = { card: s.card_note, va: s.va_note, ewallet: s.wallet_note, qris: s.qris_note }[method];

  return (
    <form action={formAction} className="mt-7 grid items-start gap-10 lg:grid-cols-[1fr_388px]">
      <input type="hidden" name="code" value={code} />
      <div className="card p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[17px] font-bold">{s.choose_payment}</p>
          <p className="flex items-center gap-2 text-[12.5px] text-muted">
            <ShieldCheck size={16} className="text-ok" /><span className="font-extrabold tracking-tight text-ok">DOKU</span> {s.secure_payment}
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3" role="radiogroup">
          {GROUPS.map(([k, lk, dk, brands]) => (
            <label key={k} className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] border-[1.5px] px-[18px] py-4 transition ${
              method === k ? "border-accent bg-[#fdf8f4]" : "border-line bg-surface hover:border-line-2"}`}>
              <input type="radio" name="method" value={k} checked={method === k} onChange={() => setMethod(k)} className="peer sr-only" />
              <span className={`h-[18px] w-[18px] shrink-0 rounded-full border-[5px] peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 ${method === k ? "border-accent" : "border-[#dcd4c8]"}`} />
              <span className="flex-1">
                <span className="block text-[15.5px] font-bold">{s[lk]}</span>
                <span className="mt-0.5 block text-[13px] text-muted">{s[dk]}</span>
              </span>
              <span className="hidden text-[11.5px] tracking-[0.06em] text-faint sm:block">{brands}</span>
            </label>
          ))}
        </div>
        <div className="mt-[22px] border-t border-hair pt-[22px]">
          {method === "va" && <><p className="label">{s.choose_bank}</p>{chips(BANKS, bank, setBank, "bank")}</>}
          {method === "ewallet" && <><p className="label">{s.choose_wallet}</p>{chips(WALLETS, wallet, setWallet, "wallet")}</>}
          <p className={`text-[13px] leading-relaxed text-muted ${method === "va" || method === "ewallet" ? "mt-3.5" : ""}`}>{note}</p>
        </div>
      </div>

      <aside className="float-card lg:sticky lg:top-[100px]">
        {summary}
        {state?.error && <p role="alert" className="mt-4 text-sm font-medium text-danger">{state.error}</p>}
        <SubmitButton className="mt-[22px] flex w-full justify-center rounded-[14px] bg-accent p-[17px] text-base font-bold text-white transition hover:bg-accent-hover disabled:opacity-60">
          {s.pay_now}
        </SubmitButton>
      </aside>
    </form>
  );
}
