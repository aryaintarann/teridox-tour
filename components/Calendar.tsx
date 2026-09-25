"use client";
import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type Props = {
  lang: "id" | "en";
  minDate: string;              // YYYY-MM-DD, earlier days disabled
  unavailable?: string[];       // full or blocked days
  name?: string;                // select mode: submits the chosen date under this name
  selected?: string;
  onChange?: (date: string) => void;
  labels?: Record<string, string>; // small caption per day (vendor console: "2/3")
  linkPrefix?: string;          // link mode: each day navigates to linkPrefix + date
  big?: boolean;
};

const ymd = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

export function Calendar({ lang, minDate, unavailable = [], name, selected, onChange, labels, linkPrefix, big = false }: Props) {
  const start = selected ?? minDate;
  const [cursor, setCursor] = useState({ y: +start.slice(0, 4), m: +start.slice(5, 7) - 1 });
  const [value, setValue] = useState(selected ?? "");
  const blocked = new Set(unavailable);
  const locale = lang === "en" ? "en-GB" : "id-ID";

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const lead = first.getUTCDay(); // Sunday first, as in the design
  const days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + i))),
  );
  const canPrev = ymd(cursor.y, cursor.m, 1) > minDate.slice(0, 8) + "01";
  const move = (delta: number) =>
    setCursor(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (((m + delta) % 12) + 12) % 12 }));

  return (
    <div className="select-none">
      {name && <input type="hidden" name={name} value={value} />}
      <div className="flex items-center justify-between">
        <p className={`font-semibold capitalize ${big ? "text-[17px]" : "text-base"}`}>
          {new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}
        </p>
        <div className="flex gap-1">
          <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="Previous month"
            className="rounded-full p-1.5 hover:bg-sand disabled:opacity-30"><CaretLeft size={16} /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next month"
            className="rounded-full p-1.5 hover:bg-sand"><CaretRight size={16} /></button>
        </div>
      </div>
      <div className={`mt-3 grid grid-cols-7 ${big ? "gap-1.5" : "gap-1"}`}>
        {weekdays.map((w, i) => <span key={i} className="py-1 text-center text-[11px] font-semibold text-[#a39a90]">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = ymd(cursor.y, cursor.m, i + 1);
          const past = date < minDate;
          const full = blocked.has(date);
          const active = value === date;
          const cls = `flex flex-col items-center justify-center font-semibold transition ${
            big ? "h-[46px] rounded-[11px] text-[15px]" : "h-[34px] rounded-lg text-[12.5px]"
          } ${
            active ? "bg-accent text-white"
            : full ? "cursor-not-allowed bg-[#ede7de] text-[#b0a79b] line-through"
            : past ? "cursor-default text-[#cfc7bc]"
            : "border border-[#eae3d9] bg-surface text-[#2a2520] hover:border-accent"
          }`;
          const inner = (
            <>
              {i + 1}
              {labels?.[date] && <span className="text-[9.5px] font-medium leading-none opacity-80">{labels[date]}</span>}
            </>
          );
          if (linkPrefix) return <a key={date} href={linkPrefix + date} className={cls}>{inner}</a>;
          const selectable = !!(name || onChange) && !past && !full;
          return (
            <button key={date} type="button" disabled={!selectable} aria-pressed={active} aria-label={date}
              onClick={() => { setValue(date); onChange?.(date); }} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
