import { getT } from "@/lib/i18n";

export async function Footer() {
  const { t } = await getT();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-10 text-sm text-muted sm:flex-row sm:justify-between">
        <p><span className="font-semibold text-ink">TeridoxTour</span>. {t("footer")}</p>
        <p>&copy; {new Date().getFullYear()} TeridoxTour</p>
      </div>
    </footer>
  );
}
