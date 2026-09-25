import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT, pick, type DictKey } from "@/lib/i18n";
import { formatDay, formatIDR } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { initials } from "@/components/Header";
import { signOut } from "@/app/actions";
import { updateProfile } from "./actions";

export const metadata = { title: "My account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const [{ lang, t }, { supabase, profile }] = await Promise.all([getT(), getSession()]);
  if (!profile) redirect("/login?next=/account");
  const settings = tab === "settings";

  const { data: bookings } = settings ? { data: null } : await supabase
    .from("bookings")
    .select("id, booking_code, booking_date, participants, status, total_price, packages(title_id, title_en, cover_image_url)")
    .order("created_at", { ascending: false });
  const { data: me } = await supabase.from("profiles").select("created_at").eq("id", profile.id).single();

  const navItem = (active: boolean) =>
    `block rounded-[10px] px-3.5 py-[11px] text-[14.5px] ${active ? "bg-accent-soft font-semibold text-accent-deep" : "text-ink-3 hover:bg-[#f7f2eb]"}`;

  return (
    <div className="mx-auto grid max-w-[1280px] items-start gap-8 px-4 pb-[72px] pt-10 md:px-14 lg:grid-cols-[268px_1fr]">
      <aside className="card p-[26px]">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#e8ddce] text-2xl font-bold text-[#7a5638]">{initials(profile.full_name)}</span>
          <p className="mt-3 text-[17px] font-bold">{profile.full_name}</p>
          <p className="mt-0.5 text-[13px] text-muted">{profile.email}</p>
          {me && <span className="mt-2.5 rounded-full bg-accent-soft px-3 py-[5px] text-xs font-semibold text-accent-deep">{t("member_since")} {me.created_at.slice(0, 4)}</span>}
        </div>
        <div className="my-5 h-px bg-hair" />
        <nav className="flex flex-col gap-0.5">
          <Link href="/account" className={navItem(!settings)}>{t("my_bookings")}</Link>
          <Link href="/account?tab=settings" className={navItem(settings)}>{t("settings")}</Link>
          <form action={signOut}>
            <button className="w-full rounded-[10px] px-3.5 py-[11px] text-left text-[14.5px] text-danger hover:bg-[#fbf0ee]">{t("logout")}</button>
          </form>
        </nav>
        {!settings && (
          <>
            <div className="my-5 h-px bg-hair" />
            <Link href="/account?tab=settings" className="block rounded-[10px] border border-line p-2.5 text-center text-sm font-semibold text-accent-text">{t("edit_profile")}</Link>
          </>
        )}
      </aside>

      {settings ? (
        <section className="max-w-[520px]">
          <h1 className="display text-[34px] tracking-[-0.7px]">{t("settings")}</h1>
          <div className="card mt-6 p-7">
            <ActionForm action={updateProfile}>
              <Field label={t("email")} value={profile.email} disabled readOnly />
              <Field label={t("full_name")} name="full_name" defaultValue={profile.full_name} required />
              <Field label={t("phone")} name="phone" type="tel" defaultValue={profile.phone} required />
              <label className="block">
                <span className="label">{t("language")}</span>
                <select name="preferred_lang" defaultValue={profile.preferred_lang} className="input">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </label>
              <SubmitButton className="btn-dark">{t("save")}</SubmitButton>
            </ActionForm>
          </div>
        </section>
      ) : (
        <section>
          <h1 className="display text-[34px] tracking-[-0.7px]">{t("my_bookings")}</h1>
          <p className="mt-1.5 text-[14.5px] text-muted">{t("bookings_sub")}</p>
          {!bookings?.length ? (
            <div className="card mt-6 px-6 py-14 text-center">
              <p className="text-muted">{t("no_bookings")}</p>
              <Link href="/packages" className="btn mt-4">{t("cta_explore")}</Link>
            </div>
          ) : (
            <ul className="mt-6 flex flex-col gap-3.5">
              {bookings.map((b) => {
                const pkg = b.packages as unknown as { title_id: string; title_en: string; cover_image_url: string | null };
                return (
                  <li key={b.id}>
                    <Link href={`/booking/${b.booking_code}`} className="flex items-center gap-[18px] rounded-[18px] border border-line bg-surface p-5 transition hover:border-accent">
                      <span className="hidden h-[74px] w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#d9c3a5] to-[#b99270] sm:block">
                        {pkg.cover_image_url && <img src={pkg.cover_image_url} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xs tracking-[0.06em] text-faint">{b.booking_code}</span>
                          <StatusBadge status={b.status} label={t(`st_${b.status}` as DictKey)} />
                        </div>
                        <p className="display mt-1.5 truncate text-xl">{pick(pkg, "title", lang)}</p>
                        <p className="mt-1 text-[13.5px] text-muted">{formatDay(b.booking_date, lang)} · {b.participants} {t("people")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[17px] font-bold">{formatIDR(b.total_price)}</p>
                        <p className="mt-1.5 hidden text-[13px] font-semibold text-accent-text sm:block">{t("view_detail")} &rarr;</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
