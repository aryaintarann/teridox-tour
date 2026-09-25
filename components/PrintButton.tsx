"use client";
import { DownloadSimple } from "@phosphor-icons/react";

export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="no-print flex items-center gap-1.5 text-sm font-semibold text-accent-text">
      {label} <DownloadSimple size={16} />
    </button>
  );
}
