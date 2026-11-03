"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  ["/admin", "📊 Vue d'ensemble", null],
  ["/admin/applications", "🧑‍🏫 Candidatures", "applications"],
  ["/admin/courses", "📚 Cours", "courses"],
  ["/admin/users", "👥 Utilisateurs", null],
  ["/admin/payments", "💳 Paiements", null],
] as const;

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto">
      {LINKS.map(([href, label, key]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold transition", active ? "bg-night text-white dark:bg-brand dark:text-on-brand" : "bg-surface text-ink-soft ring-2 ring-line hover:ring-line-strong")}>
            {label}
            {key && badges[key] > 0 && <span className="rounded-full bg-coral px-2 text-xs text-white">{badges[key]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
