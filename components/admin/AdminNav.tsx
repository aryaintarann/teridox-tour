"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, ChartBar, Package, Receipt } from "@phosphor-icons/react";

const ICONS = { packages: Package, bookings: Receipt, availability: CalendarBlank, reports: ChartBar };

export function AdminNav({ items, badge }: { items: { href: string; label: string; icon: keyof typeof ICONS }[]; badge: number }) {
  const path = usePathname();
  return (
    <nav className="flex gap-[3px] overflow-x-auto md:flex-col">
      {items.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-3 py-[11px] text-[14.5px] ${
              active ? "bg-console-3 font-semibold text-white" : "text-console-muted hover:text-white"}`}>
            <Icon size={18} />{label}
            {icon === "bookings" && badge > 0 && (
              <span className="ml-auto rounded-full bg-accent px-2 text-xs font-bold text-white">{badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
