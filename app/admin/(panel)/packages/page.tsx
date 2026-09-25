import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { durationLabel, getT } from "@/lib/i18n";
import { formatIDR } from "@/lib/format";
import type { Pkg } from "@/lib/packages";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deletePackage, togglePackage } from "@/app/admin/actions";

export const metadata = { title: "Packages" };

const COLS = "md:grid-cols-[2.4fr_1fr_.9fr_1fr_.8fr_1.4fr]";
const act = "rounded-lg border border-admin-line px-2.5 py-1.5 text-[13px] font-semibold transition hover:bg-admin-bg";

export default async function AdminPackages({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { lang, t } = await getT();
  const { data } = await createAdminClient().from("packages").select("*").order("created_at");
  const packages = (data ?? []) as Pkg[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("manage_packages")}</h1>
          <p className="mt-1 text-sm text-admin-muted">{t("manage_packages_sub")}</p>
        </div>
        <Link href="/admin/packages/new" className="rounded-[10px] bg-accent px-5 py-3 text-[14.5px] font-semibold text-white transition hover:bg-accent-hover">
          + {t("add_package")}
        </Link>
      </div>
      {error === "delete_blocked" && <p role="alert" className="mt-4 rounded-[10px] bg-danger-soft p-3 text-sm text-danger">{t("delete_blocked")}</p>}

      <div className="mt-[22px] overflow-hidden rounded-[14px] border border-admin-line bg-surface">
        <div className={`hidden border-b border-admin-line bg-[#fafbfc] px-5 py-3.5 text-xs font-bold uppercase tracking-[0.05em] text-admin-muted md:grid ${COLS}`}>
          <span>{t("th_package")}</span><span>{t("th_dest")}</span><span>{t("th_duration")}</span><span>{t("th_price")}</span><span>{t("th_status")}</span><span className="text-right">{t("th_action")}</span>
        </div>
        {packages.length === 0 && <p className="p-8 text-center text-sm text-admin-muted">{t("no_packages")}</p>}
        {packages.map((p) => (
          <div key={p.id} className={`grid items-center gap-3 border-b border-[#eff1f4] px-5 py-[15px] text-sm last:border-0 ${COLS}`}>
            <div className="flex items-center gap-3">
              <span className="h-9 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#d9c3a5] to-[#b99270]">
                {p.cover_image_url && <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.title_id}</p>
                <p className="mt-0.5 truncate text-xs text-[#8a929c]">/{p.slug}{!p.title_en && " · EN -"}</p>
              </div>
            </div>
            <span className="text-[#4a5460]">{p.destination}</span>
            <span className="text-[#4a5460]">{durationLabel(p.duration_days, lang)}</span>
            <span className="font-semibold">{formatIDR(p.price)}</span>
            <span><StatusBadge status={p.is_active ? "active" : "inactive"} label={p.is_active ? t("st_active") : t("st_inactive")} /></span>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Link href={`/admin/packages/${p.id}`} className={`${act} text-accent`}>{t("edit")}</Link>
              <form action={togglePackage}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="active" value={String(p.is_active)} />
                <button className={`${act} text-admin-muted`}>{p.is_active ? t("deactivate") : t("activate")}</button>
              </form>
              <form action={deletePackage}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message={t("confirm_delete")} className={`${act} text-[#b4443a]`}>{t("delete")}</ConfirmButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
