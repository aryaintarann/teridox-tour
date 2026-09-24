"use client";
import { useActionState, useRef, useState } from "react";
import { Plus, Translate, Trash } from "@phosphor-icons/react";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/components/ActionForm";

type Step = { time_label: string; title_id: string; title_en: string; desc_id: string; desc_en: string };
type Pkg = Record<string, any> & { package_itinerary: (Step & { id: string })[]; package_images: { id: string; image_url: string }[] };

type Field = HTMLInputElement | HTMLTextAreaElement;

export function PackageForm({ action, pkg }: { action: (p: FormState, fd: FormData) => Promise<FormState>; pkg: Pkg | null }) {
  const [state, formAction] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  const nextKey = useRef(0);
  const [steps, setSteps] = useState<(Step & { key: number })[]>(() =>
    (pkg?.package_itinerary ?? []).map((s) => ({ ...s, key: nextKey.current++ })),
  );
  const [translating, setTranslating] = useState(false);
  const [tError, setTError] = useState("");

  const v = (k: string) => (Array.isArray(pkg?.[k]) ? pkg![k].join("\n") : pkg?.[k] ?? "");

  async function translate() {
    const f = form.current!;
    const all = (name: string) => [...f.querySelectorAll<Field>(`[name="${name}"]`)];
    const pairs: [Field, Field][] = [];
    for (const k of ["title", "description", "includes", "excludes"]) pairs.push([all(`${k}_id`)[0], all(`${k}_en`)[0]]);
    for (const k of ["it_title", "it_desc"]) {
      const en = all(`${k}_en`);
      all(`${k}_id`).forEach((el, i) => pairs.push([el, en[i]]));
    }
    setTranslating(true);
    setTError("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: pairs.map(([id]) => id.value) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? res.statusText);
      pairs.forEach(([, en], i) => { if (pairs[i][0].value.trim()) en.value = json.texts[i]; });
    } catch (e) {
      setTError(`Gagal menerjemahkan: ${(e as Error).message}`);
    } finally {
      setTranslating(false);
    }
  }

  const pair = (k: string, label: string, multiline = false, hint = "") => (
    <div className="grid gap-4 sm:grid-cols-2">
      {(["id", "en"] as const).map((l) => (
        <label key={l} className="grid gap-2">
          <span className="label">{label} ({l.toUpperCase()}){hint && <span className="font-normal text-muted"> {hint}</span>}</span>
          {multiline
            ? <textarea name={`${k}_${l}`} defaultValue={v(`${k}_${l}`)} rows={4} className="input" required={l === "id" && k === "title"} />
            : <input name={`${k}_${l}`} defaultValue={v(`${k}_${l}`)} className="input" required={l === "id"} />}
        </label>
      ))}
    </div>
  );

  return (
    <form ref={form} action={formAction} className="grid gap-10">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}

      <section className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2"><span className="label">Slug URL</span>
          <input name="slug" defaultValue={v("slug")} pattern="[a-z0-9-]+" placeholder="ubud-full-day" className="input" required /></label>
        <label className="grid gap-2"><span className="label">Kategori</span>
          <select name="category" defaultValue={v("category") || "tour"} className="input">
            <option value="tour">Tour</option><option value="transfer">Antar jemput</option><option value="rental">Sewa mobil</option>
          </select></label>
        <label className="grid gap-2"><span className="label">Harga per mobil (IDR)</span>
          <input name="price" type="number" min={1} defaultValue={v("price")} className="input" required /></label>
        <label className="grid gap-2"><span className="label">Durasi (jam)</span>
          <input name="duration_hours" type="number" min={1} defaultValue={v("duration_hours")} className="input" required /></label>
        <label className="grid gap-2"><span className="label">Mobil tersedia per hari</span>
          <input name="capacity" type="number" min={1} defaultValue={v("capacity") || 1} className="input" required /></label>
        <label className="grid gap-2"><span className="label">Maks. peserta per mobil</span>
          <input name="max_participants" type="number" min={1} defaultValue={v("max_participants") || 6} className="input" required /></label>
        <label className="flex items-center gap-2 sm:col-span-3">
          <input type="checkbox" name="is_active" defaultChecked={pkg ? pkg.is_active : true} className="h-4 w-4 accent-[var(--color-accent)]" />
          <span className="label">Tampilkan di situs (aktif)</span>
        </label>
      </section>

      <section className="grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Konten</h2>
          <button type="button" onClick={translate} disabled={translating} className="btn-ghost">
            <Translate size={18} /> {translating ? "Menerjemahkan..." : "Terjemahkan otomatis"}
          </button>
        </div>
        <p className="-mt-3 text-sm text-muted">Isi Bahasa Indonesia, lalu klik Terjemahkan. Hasil EN bisa diedit sebelum disimpan.</p>
        {tError && <p role="alert" className="text-sm font-medium text-danger">{tError}</p>}
        {pair("title", "Judul")}
        {pair("description", "Deskripsi", true)}
        {pair("includes", "Termasuk", true, "satu per baris")}
        {pair("excludes", "Tidak termasuk", true, "satu per baris")}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Itinerary</h2>
        {steps.length === 0 && <p className="text-sm text-muted">Belum ada langkah itinerary.</p>}
        {steps.map((s) => (
          <div key={s.key} className="card grid gap-3 p-4 sm:grid-cols-[100px_1fr_1fr_auto]">
            <input name="it_time" defaultValue={s.time_label} placeholder="08:00" aria-label="Waktu" className="input" />
            <div className="grid gap-2">
              <input name="it_title_id" defaultValue={s.title_id} placeholder="Judul (ID)" aria-label="Judul ID" className="input" />
              <input name="it_desc_id" defaultValue={s.desc_id} placeholder="Keterangan (ID)" aria-label="Keterangan ID" className="input" />
            </div>
            <div className="grid gap-2">
              <input name="it_title_en" defaultValue={s.title_en} placeholder="Title (EN)" aria-label="Judul EN" className="input" />
              <input name="it_desc_en" defaultValue={s.desc_en} placeholder="Description (EN)" aria-label="Keterangan EN" className="input" />
            </div>
            <button type="button" onClick={() => setSteps((x) => x.filter((y) => y.key !== s.key))}
              aria-label="Hapus langkah" className="self-start rounded-full p-2 text-danger hover:bg-danger/10">
              <Trash size={18} />
            </button>
          </div>
        ))}
        <button type="button" className="btn-ghost w-fit"
          onClick={() => setSteps((x) => [...x, { key: nextKey.current++, time_label: "", title_id: "", title_en: "", desc_id: "", desc_en: "" }])}>
          <Plus size={18} /> Tambah langkah
        </button>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Foto</h2>
        {pkg && pkg.package_images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pkg.package_images.map((img, i) => (
              <label key={img.id} className="relative block cursor-pointer">
                <img src={img.image_url} alt="" className="aspect-[4/3] w-full rounded-[10px] object-cover" />
                <span className="mt-1 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="remove_image" value={img.id} /> Hapus{i === 0 && " (sampul)"}
                </span>
              </label>
            ))}
          </div>
        )}
        <label className="grid gap-2">
          <span className="label">Tambah foto <span className="font-normal text-muted">JPG/PNG/WebP, maks. 5MB. Foto pertama jadi sampul.</span></span>
          <input type="file" name="images" accept="image/*" multiple className="input" />
        </label>
      </section>

      <div className="flex items-center gap-4">
        <SubmitButton>Simpan paket</SubmitButton>
        {state?.error && <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>}
      </div>
    </form>
  );
}
