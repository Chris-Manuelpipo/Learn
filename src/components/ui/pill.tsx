import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { palette } from "@/lib/colors";

export function Pill({ children, color, className, solid }: { children: ReactNode; color?: string; className?: string; solid?: boolean }) {
  const p = palette(color ?? "violet");
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold leading-none whitespace-nowrap", className)}
      style={solid ? { background: p.from, color: "white" } : { background: `color-mix(in srgb, ${p.from} 14%, transparent)`, color: `color-mix(in srgb, ${p.ink} 75%, var(--ink))` }}
    >
      {children}
    </span>
  );
}
