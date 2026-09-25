"use client";
import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Check, Plus, Sparkle, Trash } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/components/ActionForm";

type Step = { key: number; time_label: string; title_id: string; title_en: string; desc_id: string; desc_en: string };
type Pkg = Record<string, any> & { package_itinerary: Omit<Step, "key">[]; package_images: { id: string; image_url: string }[] };

const inp = "w-full rounded-[9px] border border-[#dce0e5] px-3.5 py-3 text-[14.5px] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25";
const ta = `${inp} resize-none leading-[1.6]`;
const lbl = "mb-1.5 block text-[13px] font-semibold";
const joinLines = (v: unknown) => (Array.isArray(v) ? v.join("\n") : "");

export function PackageForm({ action, pkg, s }: {
  action: (p: FormState, fd: FormData) => Promise<FormState>;
  pkg: Pkg | null;
  s: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, null);
  const nextKey = useRef(0);
  const [id, setId] = useState({
    title: pkg?.title_id ?? "", description: pkg?.description_id ?? "",
    includes: joinLines(pkg?.includes_id), excludes: joinLines(pkg?.excludes_id),
  });
  const [en, setEn] = useState({
    title: pkg?.title_en ?? "", description: pkg?.description_en ?? "",
    includes: joinLines(pkg?.includes_en), excludes: joinLines(pkg?.excludes_en),
  });
  const [steps, setSteps] = useState<Step[]>(() => (pkg?.package_itinerary ?? []).map((st) => ({ ...st, key: nextKey.current++ })));
  const [showEn, setShowEn] = useState(!!pkg?.title_en);
  const [justTranslated, setJustTranslated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tError, setTError] = useState("");

  const setStep = (key: number, patch: Partial<Step>) => setSteps((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  async function translate() {
    const fields = ["title", "description", "includes", "excludes"] as const;
    const texts = [...fields.map((f) => id[f]), ...steps.flatMap((x) => [x.title_id, x.desc_id])];
    setBusy(true);
    setTError("");
    try {
      const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texts }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? res.statusText);
      const out: string[] = json.texts;
      setEn(Object.fromEntries(fields.map((f, i) => [f, out[i]])) as typeof en);
      setSteps((xs) => xs.map((x, i) => ({ ...x, title_en: out[4 + i * 2], desc_en: out[5 + i * 2] })));
      setShowEn(true);
      setJustTranslated(true);
    } catch (e) {
      setTError(`${s.tr_failed}: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const numField = (name: string, label: string, def: unknown, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block"><span className={lbl}>{label}</span>
      <input name={name} type="number" defaultValue={def as number | undefined} className={inp} {...extra} /></label>
  );

  return (
    <form action={formAction} className="mt-[22px]">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* Indonesian source */}
        <section className="rounded-[14px] border border-admin-line bg-surface p-[26px]">
          <p className="flex items-center gap-2.5">
            <span className="rounded-md bg-[#fdede2] px-2.5 py-[5px] text-xs font-bold text-accent-hover">ID</span>
            <span className="text-base font-bold">{s.source_id}</span>
          </p>
          <div className="mt-5 flex flex-col gap-4">
            <label className="block"><span className={lbl}>{s.f_title}</span>
              <input name="title_id" value={id.title} onChange={(e) => setId({ ...id, title: e.target.value })} required className={inp} /></label>
            <label className="block"><span className={lbl}>{s.f_desc}</span>
              <textarea name="description_id" value={id.description} onChange={(e) => setId({ ...id, description: e.target.value })} className={`${ta} h-[120px]`} /></label>
            <label className="block"><span className={lbl}>{s.f_included} <span className="font-normal text-admin-muted">({s.f_one_per_line})</span></span>
              <textarea name="includes_id" value={id.includes} onChange={(e) => setId({ ...id, includes: e.target.value })} className={`${ta} h-20`} /></label>
            <label className="block"><span className={lbl}>{s.f_excluded} <span className="font-normal text-admin-muted">({s.f_one_per_line})</span></span>
              <textarea name="excludes_id" value={id.excludes} onChange={(e) => setId({ ...id, excludes: e.target.value })} className={`${ta} h-20`} /></label>
            <div className="grid grid-cols-3 gap-3">
              {numField("price", `${s.th_price} (Rp)`, pkg?.price, { min: 1, required: true })}
              {numField("duration_days", s.f_days, pkg?.duration_days ?? 1, { min: 1, required: true })}
              <label className="block"><span className={lbl}>{s.th_dest}</span>
                <input name="destination" list="destinations" defaultValue={pkg?.destination ?? "Bali"} required className={inp} />
                <datalist id="destinations"><option value="Bali" /><option value="Labuan Bajo" /></datalist></label>
            </div>
            <div>
              <span className={lbl}>{s.f_photos}</span>
              {!!pkg?.package_images.length && (
                <div className="mb-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                  {pkg.package_images.map((img, i) => (
                    <label key={img.id} className="block cursor-pointer text-xs">
                      <img src={img.image_url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                      <span className="mt-1 flex items-center gap-1.5 text-admin-muted">
                        <input type="checkbox" name="remove_image" value={img.id} /> {s.remove}{i === 0 && " (cover)"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <label className="block cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-[#dce0e5] p-5 text-center text-[13.5px] text-[#8a929c] hover:border-accent">
                {s.drop_photos}
                <input type="file" name="images" accept="image/*" multiple className="mt-2 block w-full text-xs" />
              </label>
            </div>
          </div>
        </section>

        {/* English preview */}
        <section className="rounded-[14px] border border-admin-line bg-surface p-[26px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2.5">
              <span className="rounded-md bg-info-soft px-2.5 py-[5px] text-xs font-bold text-info">EN</span>
              <span className="text-base font-bold">{s.english_preview}</span>
            </p>
            <button type="button" onClick={translate} disabled={busy}
              className="flex items-center gap-1.5 rounded-[9px] bg-console px-4 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-accent disabled:opacity-60">
              <Sparkle size={15} weight="fill" /> {busy ? "..." : s.auto_translate}
            </button>
          </div>
          {tError && <p role="alert" className="mt-4 rounded-[9px] bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">{tError}</p>}
          {!showEn ? (
            <div className="mt-5 rounded-[11px] border border-dashed border-[#dce0e5] px-6 py-12 text-center">
              <p className="text-[14.5px] font-semibold text-[#4a5460]">{s.tr_empty_title}</p>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-[13.5px] leading-[1.6] text-[#8a929c]">{s.tr_empty_desc}</p>
              <button type="button" onClick={() => setShowEn(true)} className="mt-3 text-[13px] font-semibold text-accent">{s.edit}</button>
            </div>
          ) : (
            <div>
              {justTranslated && (
                <p className="mt-[18px] flex items-center gap-2 rounded-[9px] bg-[#eaf4ee] px-3.5 py-2.5 text-[13px] text-[#1f6b47]"><Check size={16} /> {s.tr_done}</p>
              )}
              <div className="mt-4 flex flex-col gap-4">
                <label className="block"><span className={lbl}>{s.f_title}</span>
                  <input name="title_en" value={en.title} onChange={(e) => setEn({ ...en, title: e.target.value })} className={`${inp} bg-[#fcfdfe]`} /></label>
                <label className="block"><span className={lbl}>{s.f_desc}</span>
                  <textarea name="description_en" value={en.description} onChange={(e) => setEn({ ...en, description: e.target.value })} className={`${ta} h-[120px] bg-[#fcfdfe]`} /></label>
                <label className="block"><span className={lbl}>{s.f_included}</span>
                  <textarea name="includes_en" value={en.includes} onChange={(e) => setEn({ ...en, includes: e.target.value })} className={`${ta} h-20 bg-[#fcfdfe]`} /></label>
                <label className="block"><span className={lbl}>{s.f_excluded}</span>
                  <textarea name="excludes_en" value={en.excludes} onChange={(e) => setEn({ ...en, excludes: e.target.value })} className={`${ta} h-20 bg-[#fcfdfe]`} /></label>
                <p className="text-[12.5px] leading-[1.6] text-[#8a929c]">{s.tr_edit_note}</p>
              </div>
            </div>
          )}
          {!showEn && (["title", "description", "includes", "excludes"] as const).map((f) => (
            <input key={f} type="hidden" name={`${f}_en`} value={en[f]} />
          ))}
        </section>
      </div>

      {/* Operations + itinerary */}
      <section className="mt-6 rounded-[14px] border border-admin-line bg-surface p-[26px]">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <label className="block"><span className={lbl}>{s.f_slug}</span>
            <input name="slug" defaultValue={pkg?.slug} pattern="[a-z0-9\-]+" placeholder="sailing-komodo" required className={inp} /></label>
          {numField("capacity", s.f_capacity, pkg?.capacity ?? 1, { min: 1, required: true })}
          {numField("max_participants", s.f_max, pkg?.max_participants ?? 8, { min: 1, required: true })}
          {numField("rating", s.f_rating, pkg?.rating ?? undefined, { min: 0, max: 5, step: 0.1 })}
          {numField("review_count", s.f_reviews, pkg?.review_count ?? undefined, { min: 0 })}
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="is_active" defaultChecked={pkg ? pkg.is_active : true} className="h-4 w-4 accent-[#c2602c]" /> {s.f_active}
        </label>

        <p className="mt-6 text-base font-bold">{s.f_itinerary}</p>
        <div className="mt-3 flex flex-col gap-3">
          {steps.map((x, i) => (
            <div key={x.key} className="grid gap-2.5 rounded-[11px] border border-admin-line p-3.5 md:grid-cols-[90px_1fr_1fr_auto]">
              <input name="it_time" value={x.time_label} onChange={(e) => setStep(x.key, { time_label: e.target.value })}
                placeholder={`Day ${i + 1}`} aria-label="Label" className={inp} />
              <div className="grid gap-2">
                <input name="it_title_id" value={x.title_id} onChange={(e) => setStep(x.key, { title_id: e.target.value })} placeholder="Judul (ID)" aria-label="Judul ID" className={inp} />
                <input name="it_desc_id" value={x.desc_id} onChange={(e) => setStep(x.key, { desc_id: e.target.value })} placeholder="Keterangan (ID)" aria-label="Keterangan ID" className={inp} />
              </div>
              <div className="grid gap-2">
                <input name="it_title_en" value={x.title_en} onChange={(e) => setStep(x.key, { title_en: e.target.value })} placeholder="Title (EN)" aria-label="Title EN" className={`${inp} bg-[#fcfdfe]`} />
                <input name="it_desc_en" value={x.desc_en} onChange={(e) => setStep(x.key, { desc_en: e.target.value })} placeholder="Description (EN)" aria-label="Description EN" className={`${inp} bg-[#fcfdfe]`} />
              </div>
              <button type="button" onClick={() => setSteps((xs) => xs.filter((y) => y.key !== x.key))} aria-label={s.remove}
                className="self-start rounded-lg p-2 text-[#b4443a] hover:bg-danger-soft"><Trash size={18} /></button>
            </div>
          ))}
          <button type="button" className="flex w-fit items-center gap-1.5 rounded-[9px] border border-admin-line px-3.5 py-2 text-[13.5px] font-semibold hover:bg-admin-bg"
            onClick={() => setSteps((xs) => [...xs, { key: nextKey.current++, time_label: "", title_id: "", title_en: "", desc_id: "", desc_en: "" }])}>
            <Plus size={15} /> {s.add_step}
          </button>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        {state?.error && <p role="alert" className="mr-auto text-sm font-medium text-danger">{state.error}</p>}
        <Link href="/admin/packages" className="rounded-[10px] border border-[#dce0e5] bg-surface px-[22px] py-[13px] text-[14.5px] font-semibold">{s.cancel}</Link>
        <SubmitButton className="rounded-[10px] bg-accent px-[22px] py-[13px] text-[14.5px] font-bold text-white transition hover:bg-accent-hover disabled:opacity-60">
          {s.save_both}
        </SubmitButton>
      </div>
    </form>
  );
}
