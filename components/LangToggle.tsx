export function LangToggle({ lang, action, dark = false }: { lang: "id" | "en"; action: (fd: FormData) => Promise<void>; dark?: boolean }) {
  return (
    <form action={action} className={`flex items-center gap-1 rounded-full border p-[3px] ${dark ? "border-admin-line" : "border-line-2 bg-surface"}`}>
      {(["id", "en"] as const).map((l) => (
        <button key={l} name="lang" value={l} aria-pressed={lang === l}
          className={`rounded-full px-3 py-[5px] text-[13px] font-bold transition ${
            lang === l ? "bg-accent text-white" : dark ? "text-admin-muted" : "text-faint hover:text-ink"
          }`}>
          {l.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
