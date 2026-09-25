import { createAdminClient } from "@/lib/supabase/admin";
import { getT } from "@/lib/i18n";
import { formatDate, todayWITA } from "@/lib/format";
import { Calendar } from "@/components/Calendar";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/SubmitButton";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { setAvailability } from "@/app/admin/actions";

export const metadata = { title: "Availability" };

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ package?: string; date?: string }> }) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const db = createAdminClient();
  const { data: packages } = await db.from("packages").select("id, title_id, capacity").order("created_at");
  const pkg = packages?.find((p) => p.id === sp.package) ?? packages?.[0];
  if (!pkg) return <p className="text-admin-muted">{t("no_packages")}</p>;

  const { data: rows } = await db
    .from("availability").select("date, is_blocked, slots_total, slots_booked").eq("package_id", pkg.id).gte("date", todayWITA());
  const labels: Record<string, string> = {};
  const unavailable: string[] = [];
  for (const r of rows ?? []) {
    labels[r.date] = r.is_blocked ? "×" : `${r.slots_booked}/${r.slots_total}`;
    if (r.is_blocked || r.slots_booked >= r.slots_total) unavailable.push(r.date);
  }
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : null;
  const current = rows?.find((r) => r.date === date);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">{t("manage_availability")}</h1>
      <form className="mt-5">
        <label className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-admin-muted">{t("th_package")}</span>
          <AutoSubmitSelect name="package" defaultValue={pkg.id} className="rounded-[9px] border border-admin-line bg-surface px-3 py-2.5 text-sm">
            {packages!.map((p) => <option key={p.id} value={p.id}>{p.title_id}</option>)}
          </AutoSubmitSelect>
        </label>
      </form>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="rounded-[14px] border border-admin-line bg-surface p-5">
          <Calendar big lang={lang} minDate={todayWITA()} unavailable={unavailable} labels={labels}
            selected={date ?? undefined} linkPrefix={`?package=${pkg.id}&date=`} />
          <p className="mt-3 text-xs text-admin-muted">{t("avail_hint")} (default: {pkg.capacity})</p>
        </div>

        {date ? (
          <div className="h-fit rounded-[14px] border border-admin-line bg-surface p-5">
            <p className="font-bold">{formatDate(date, lang)}</p>
            <p className="mt-1 text-sm text-admin-muted">{t("booked")}: {current?.slots_booked ?? 0}</p>
            <ActionForm action={setAvailability} className="mt-4 grid gap-4">
              <input type="hidden" name="package_id" value={pkg.id} />
              <input type="hidden" name="date" value={date} />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold">{t("avail_slots")}</span>
                <input type="number" name="slots_total" min={0} defaultValue={current?.slots_total ?? pkg.capacity} required
                  className="w-full rounded-[9px] border border-[#dce0e5] px-3.5 py-3 text-[14.5px]" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="is_blocked" defaultChecked={current?.is_blocked ?? false} className="h-4 w-4 accent-[#c2602c]" />
                {t("avail_block")}
              </label>
              <SubmitButton className="rounded-[10px] bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent-hover">{t("save")}</SubmitButton>
            </ActionForm>
          </div>
        ) : (
          <p className="text-sm text-admin-muted">{t("avail_pick")}</p>
        )}
      </div>
    </div>
  );
}
