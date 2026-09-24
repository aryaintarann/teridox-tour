import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getT, pick, type DictKey } from "@/lib/i18n";
import { formatDate, formatIDR } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionForm } from "@/components/ActionForm";
import { Field } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";
import { signOut } from "@/app/actions";
import { updateProfile } from "./actions";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const [{ lang, t }, { supabase, profile }] = await Promise.all([getT(), getSession()]);
  if (!profile) redirect("/login?next=/account");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_code, booking_date, status, total_price, packages(title_id, title_en, cover_image_url)")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <section>
        <h1 className="mb-6 text-3xl font-bold tracking-tight">{t("my_bookings")}</h1>
        {!bookings?.length ? (
          <div className="card p-8 text-center">
            <p className="text-muted">{t("no_bookings")}</p>
            <Link href="/packages" className="btn mt-4">{t("nav_packages")}</Link>
          </div>
        ) : (
          <ul className="grid gap-3">
            {bookings.map((b) => {
              const pkg = b.packages as unknown as { title_id: string; title_en: string; cover_image_url: string | null };
              return (
                <li key={b.id}>
                  <Link href={`/booking/${b.booking_code}`} className="card flex items-center gap-4 p-3 transition hover:border-accent">
                    {pkg.cover_image_url && <img src={pkg.cover_image_url} alt="" className="h-16 w-20 shrink-0 rounded-[10px] object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{pick(pkg, "title", lang)}</p>
                      <p className="text-sm text-muted">{formatDate(b.booking_date, lang)} | {b.booking_code}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <StatusBadge status={b.status} label={t(`st_${b.status}` as DictKey)} />
                      <p className="mt-1 text-sm font-semibold">{formatIDR(b.total_price)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside>
        <h2 className="mb-6 text-xl font-bold">{t("profile")}</h2>
        <ActionForm action={updateProfile}>
          <Field label={t("email")} value={profile.email} disabled readOnly />
          <Field label={t("full_name")} name="full_name" defaultValue={profile.full_name} required />
          <Field label={t("phone")} name="phone" type="tel" defaultValue={profile.phone} required />
          <label className="grid gap-2">
            <span className="label">{t("language")}</span>
            <select name="preferred_lang" defaultValue={profile.preferred_lang} className="input">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
          <SubmitButton>{t("save")}</SubmitButton>
        </ActionForm>
        <form action={signOut} className="mt-4">
          <button className="btn-ghost w-full">{t("nav_logout")}</button>
        </form>
      </aside>
    </div>
  );
}
