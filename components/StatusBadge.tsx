const tone: Record<string, string> = {
  pending: "bg-warn-soft text-warn",
  paid: "bg-info-soft text-info",
  confirmed: "bg-ok-soft text-ok",
  success: "bg-ok-soft text-ok",
  active: "bg-ok-soft text-ok",
  completed: "bg-[#eff1f4] text-[#5a636d]",
  inactive: "bg-warn-soft text-warn",
  cancelled: "bg-danger-soft text-danger",
  failed: "bg-danger-soft text-danger",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-[11px] py-[5px] text-xs font-bold ${tone[status] ?? "bg-[#eff1f4]"}`}>
      {label}
    </span>
  );
}
