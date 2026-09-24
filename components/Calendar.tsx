"use client";
import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type Props = {
  lang: "id" | "en";
  minDate: string;              // YYYY-MM-DD, earlier days disabled
  unavailable?: string[];       // full or blocked days
  name?: string;                // select mode: submits the chosen date under this name
  selected?: string;
  labels?: Record<string, string>; // small caption per day (admin: "2/3")
  linkPrefix?: string;          // link mode: each day navigates to linkPrefix + date
};

const ymd = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

export function Calendar({ lang, minDate, unavailable = [], name, selected, labels, linkPrefix }: Props) {
  const start = selected ?? minDate;
  const [cursor, setCursor] = useState({ y: +start.slice(0, 4), m: +start.slice(5, 7) - 1 });
  const [value, setValue] = useState(selected ?? "");
  const blocked = new Set(unavailable);
  const locale = lang === "en" ? "en-GB" : "id-ID";

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))),
  );
  const canPrev = ymd(cursor.y, cursor.m, 1) > minDate.slice(0, 8) + "01";
  const move = (delta: number) =>
    setCursor(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (((m + delta) % 12) + 12) % 12 }));

  return (
    <div className="select-none">
      {name && <input type="hidden" name={name} value={value} required />}
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="Previous month"
          className="rounded-full p-2 hover:bg-accent-soft disabled:opacity-30">
          <CaretLeft size={18} />
        </button>
        <p className="font-semibold capitalize">
          {new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}
        </p>
        <button type="button" onClick={() => move(1)} aria-label="Next month" className="rounded-full p-2 hover:bg-accent-soft">
          <CaretRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {weekdays.map((w, i) => <span key={i} className="py-1">{w}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = ymd(cursor.y, cursor.m, i + 1);
          const past = date < minDate;
          const full = blocked.has(date);
          const active = value === date;
          const cls = `flex aspect-square flex-col items-center justify-center rounded-[10px] text-sm transition ${
            active ? "bg-accent text-accent-fg font-semibold"
            : full ? "bg-danger/10 text-danger line-through"
            : past ? "text-muted/40"
            : "hover:bg-accent-soft"
          }`;
          const inner = (
            <>
              {i + 1}
              {labels?.[date] && <span className="text-[10px] leading-none opacity-80">{labels[date]}</span>}
            </>
          );
          if (linkPrefix) return <a key={date} href={linkPrefix + date} className={cls}>{inner}</a>;
          return (
            <button key={date} type="button" disabled={past || full || !name} onClick={() => setValue(date)}
              aria-pressed={active} aria-label={date} className={`${cls} disabled:cursor-default`}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
