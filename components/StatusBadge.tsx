const tone: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  paid: "bg-accent-soft text-accent",
  success: "bg-accent-soft text-accent",
  confirmed: "bg-accent text-accent-fg",
  completed: "bg-line text-ink",
  cancelled: "bg-danger/10 text-danger",
  failed: "bg-danger/10 text-danger",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[status] ?? "bg-line"}`}>
      {label}
    </span>
  );
}
