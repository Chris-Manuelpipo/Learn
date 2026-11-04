import { Lock } from "lucide-react";
import { Icon } from "./icon";
import { palette } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** Médaille de badge : anneau teinté + icône au trait. Grisée tant qu'elle n'est pas obtenue. */
export function BadgeMedal({ icon, color, earned = true, size = 64, className }: { icon: string; color: string; earned?: boolean; size?: number; className?: string }) {
  const p = palette(color);
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center rounded-full", className)} style={{ width: size, height: size }}>
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: earned ? `linear-gradient(145deg, ${p.from}, ${p.to})` : "var(--surface-2)",
          boxShadow: earned ? `inset 0 0 0 3px color-mix(in srgb, white 35%, transparent)` : "inset 0 0 0 1px var(--line-strong)",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{ inset: size * 0.12, background: earned ? "color-mix(in srgb, white 14%, transparent)" : "transparent", border: earned ? "1px solid color-mix(in srgb, white 35%, transparent)" : "none" }}
      />
      <Icon name={icon} className={cn("relative", earned ? "text-white" : "text-muted/60")} style={{ width: size * 0.42, height: size * 0.42 }} />
      {!earned && (
        <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-surface text-muted ring-1 ring-line-strong" style={{ width: size * 0.36, height: size * 0.36 }}>
          <Lock style={{ width: size * 0.18, height: size * 0.18 }} />
        </span>
      )}
    </span>
  );
}
