"use client";
import { useState } from "react";
import Link from "next/link";
import { Calendar } from "@/components/Calendar";

type S = Record<"person" | "fee_note" | "availability" | "selected" | "full" | "pick_date_book" | "free_cancel", string>;

export function DetailBookCard({ lang, slug, priceText, minDate, unavailable, s }: {
  lang: "id" | "en"; slug: string; priceText: string; minDate: string; unavailable: string[]; s: S;
}) {
  const [date, setDate] = useState("");
  return (
    <aside className="float-card h-fit lg:sticky lg:top-[100px]">
      <p className="flex items-baseline gap-1.5">
        <span className="text-[26px] font-bold">{priceText}</span>
        <span className="text-[13px] text-muted">/ {s.person}</span>
      </p>
      <p className="mt-1 text-[13px] text-muted">{s.fee_note}</p>
      <div className="my-5 h-px bg-hair" />
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-faint">{s.availability}</p>
      <Calendar lang={lang} minDate={minDate} unavailable={unavailable} onChange={setDate} />
      <div className="mt-3.5 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[3px] bg-accent" />{s.selected}</span>
        <span className="flex items-center gap-1.5"><span className="h-[9px] w-[9px] rounded-[3px] bg-[#ede7de]" />{s.full}</span>
      </div>
      <Link href={`/book/${slug}${date ? `?date=${date}` : ""}`}
        className="mt-[22px] flex justify-center rounded-[14px] bg-accent p-[17px] text-base font-bold text-white transition hover:bg-accent-hover">
        {s.pick_date_book}
      </Link>
      <p className="mt-3 text-center text-[12.5px] text-faint">{s.free_cancel}</p>
    </aside>
  );
}
