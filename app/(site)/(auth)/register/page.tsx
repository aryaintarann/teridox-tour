import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { getT } from "@/lib/i18n";
import { RegisterForm } from "@/components/AuthForms";
import { register } from "../actions";

export const metadata = { title: "Sign up" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "" } = await searchParams;
  const { t } = await getT();
  const keys = ["full_name", "email", "phone", "password", "confirm_password", "agree", "create_account"] as const;
  return (
    <div className="mx-auto grid max-w-[1280px] lg:min-h-[760px] lg:grid-cols-2">
      <div className="px-4 py-12 md:px-20 md:py-16">
        <h1 className="display text-[38px] tracking-[-0.8px]">{t("reg_title")}</h1>
        <p className="mt-2 text-[15px] text-muted">{t("reg_sub")}</p>
        <RegisterForm action={register} next={next} s={Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<(typeof keys)[number], string>} />
        <p className="mt-[18px] max-w-[440px] text-center text-sm text-muted">
          {t("have_account")} <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-accent-text">{t("login")}</Link>
        </p>
      </div>
      <div className="hidden flex-col justify-between gap-10 bg-[linear-gradient(160deg,#3a322a,#7a5232)] p-16 text-white lg:flex">
        <p className="display max-w-[380px] text-[30px] leading-[1.3]">{t("reg_pitch")}</p>
        <div className="h-[300px] overflow-hidden rounded-[18px] border border-white/20">
          <img src="https://picsum.photos/seed/teridox-register-deck/760/600" alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <ul className="flex flex-col gap-3 text-[14.5px] text-white/80">
          {(["perk1", "perk2", "perk3"] as const).map((k) => <li key={k} className="flex items-center gap-2"><Check size={16} /> {t(k)}</li>)}
        </ul>
      </div>
    </div>
  );
}
