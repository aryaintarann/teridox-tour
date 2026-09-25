import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n";
import { formatIDR, isLocalPhone, todayWITA } from "@/lib/format";

export const metadata = { title: "Reports" };

const PAID = ["paid", "confirmed", "completed"];
const PERIODS = ["6m", "12m", "ytd"] as const;
// Validated with the dataviz palette checker (light surface): lightness, chroma, CVD and contrast all pass.
const DOMESTIC = "#C2602C", INTERNATIONAL = "#2F6DA3";

type Row = { status: string; total_price: number; created_at: string; profiles: { phone: string } };

// First day (YYYY-MM-01) of each month in the period, oldest first.
function months(period: string) {
  const [y, m] = todayWITA().split("-").map(Number);
  const n = period === "12m" ? 12 : period === "ytd" ? m : 6;
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - n + i, 1)).toISOString().slice(0, 10));
}

export default async function Reports({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period: raw } = await searchParams;
  const period = (PERIODS as readonly string[]).includes(raw ?? "") ? raw! : "6m";
  const { lang, t } = await getT();
  const ms = months(period);
  const from = ms[0];
  // Previous period of equal length, for the deltas.
  const [fy, fm] = from.split("-").map(Number);
  const prevFrom = new Date(Date.UTC(fy, fm - 1 - ms.length, 1)).toISOString().slice(0, 10);

  // ponytail: aggregates in JS; move to a SQL view when a period holds tens of thousands of bookings
  const { data } = await createAdminClient()
    .from("bookings")
    .select("status, total_price, created_at, profiles(phone)")
    .gte("created_at", `${prevFrom}T00:00:00+08:00`)
    .neq("status", "cancelled");
  const all = (data ?? []) as unknown as Row[];
  const fromTs = Date.parse(`${from}T00:00:00+08:00`);
  const inCur = all.filter((r) => Date.parse(r.created_at) >= fromTs);
  const inPrev = all.filter((r) => Date.parse(r.created_at) < fromTs);
  const paid = inCur.filter((r) => PAID.includes(r.status));
  const revenue = (rows: Row[]) => rows.filter((r) => PAID.includes(r.status)).reduce((s, r) => s + r.total_price, 0);
  const local = paid.filter((r) => isLocalPhone(r.profiles.phone)).length;
  const foreign = paid.length - local;
  const pct = (n: number) => (paid.length ? (n / paid.length) * 100 : 0);
  const fmtPct = (n: number) => n.toLocaleString(lang === "en" ? "en-GB" : "id-ID", { maximumFractionDigits: 1 }) + "%";
  const delta = (cur: number, prev: number) => {
    if (!prev) return null;
    const d = ((cur - prev) / prev) * 100;
    return { text: `${d >= 0 ? "+" : ""}${fmtPct(d)} ${t("vs_prev")}`, up: d >= 0 };
  };

  const stats = [
    { label: t("s_bookings"), value: String(inCur.length), d: delta(inCur.length, inPrev.length) },
    { label: t("s_revenue"), value: formatIDR(revenue(inCur)), d: delta(revenue(inCur), revenue(inPrev)) },
    { label: t("s_local"), value: String(local), note: `${fmtPct(pct(local))} ${t("of_paid")}` },
    { label: t("s_foreign"), value: String(foreign), note: `${fmtPct(pct(foreign))} ${t("of_paid")}` },
  ];

  const monthFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "id-ID", { month: "short", timeZone: "UTC" });
  const chart = ms.map((m) => {
    const key = m.slice(0, 7);
    const rp = paid.filter((r) => new Date(new Date(r.created_at).getTime() + 8 * 3600_000).toISOString().startsWith(key))
      .reduce((s, r) => s + r.total_price, 0);
    return { label: monthFmt.format(new Date(m + "T00:00:00Z")), value: rp / 1_000_000 };
  });
  const max = Math.max(...chart.map((c) => c.value), 1);
  const million = (v: number) => v.toLocaleString(lang === "en" ? "en-GB" : "id-ID", { maximumFractionDigits: 1 });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("reports")}</h1>
          <p className="mt-1 text-sm text-admin-muted">{t("reports_sub")}</p>
        </div>
        <nav className="flex gap-2">
          {PERIODS.map((p) => (
            <Link key={p} href={p === "6m" ? "?" : `?period=${p}`}
              className={`rounded-[9px] border px-[15px] py-[9px] text-[13.5px] font-semibold ${period === p ? "border-accent bg-accent text-white" : "border-admin-line bg-surface text-[#4a5460]"}`}>
              {t(`p${p}` as "p6m")}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-[22px] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[14px] border border-admin-line bg-surface p-5">
            <p className="text-[13px] text-admin-muted">{s.label}</p>
            <p className="mt-2 text-[28px] font-bold tracking-[-0.5px] tabular-nums">{s.value}</p>
            {s.d ? <p className={`mt-2 text-[12.5px] font-semibold ${s.d.up ? "text-[#1f6b47]" : "text-[#b4443a]"}`}>{s.d.text}</p>
              : s.note ? <p className="mt-2 text-[12.5px] text-admin-muted">{s.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <figure className="rounded-[14px] border border-admin-line bg-surface p-6">
          <figcaption className="text-base font-bold">{t("revenue_chart")}</figcaption>
          <div className="mt-6 flex h-[230px] items-end gap-2 sm:gap-[18px]" aria-hidden>
            {chart.map((c) => (
              <div key={c.label} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold text-[#4a5460] tabular-nums">{c.value ? million(c.value) : ""}</span>
                <span className="w-full max-w-14 rounded-t-[4px] bg-accent transition group-hover:bg-accent-hover"
                  style={{ height: `${(c.value / max) * 160}px` }} />
                <span className="text-xs text-[#8a929c]">{c.label}</span>
                <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md bg-console px-2 py-1 text-xs text-white group-hover:block">
                  {c.label}: Rp {million(c.value)} {lang === "en" ? "million" : "juta"}
                </span>
              </div>
            ))}
          </div>
          <table className="sr-only">
            <caption>{t("revenue_chart")}</caption>
            <tbody>{chart.map((c) => <tr key={c.label}><th>{c.label}</th><td>{million(c.value)}</td></tr>)}</tbody>
          </table>
        </figure>

        <figure className="rounded-[14px] border border-admin-line bg-surface p-6">
          <figcaption className="text-base font-bold">{t("origin_chart")}</figcaption>
          <div className="mt-6 flex flex-col gap-[18px]">
            {([[t("s_local"), local, DOMESTIC], [t("s_foreign"), foreign, INTERNATIONAL]] as const).map(([label, n, color]) => (
              <div key={label}>
                <p className="mb-2 flex justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />{label}</span>
                  <span className="text-admin-muted tabular-nums">{fmtPct(pct(n))}</span>
                </p>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#eff1f4]">
                  <div className="h-full rounded-full" style={{ width: `${pct(n)}%`, background: color }} />
                </div>
                <p className="mt-1.5 text-[12.5px] text-[#8a929c]">{n}</p>
              </div>
            ))}
          </div>
          <div className="my-[22px] h-px bg-[#eff1f4]" />
          <p className="text-[13.5px] leading-[1.65] text-admin-muted">{t("origin_note")}</p>
        </figure>
      </div>
    </div>
  );
}
