import { cn, initials } from "@/lib/utils";
import { palette } from "@/lib/colors";

type U = { name: string; avatarUrl?: string | null; avatarColor?: string | null };

/** Photo si disponible ; les initiales sont rendues derrière et restent visibles si l'image ne charge pas. */
export function Avatar({ user, size = 40, className, ring }: { user: U; size?: number; className?: string; ring?: boolean }) {
  const p = palette(user.avatarColor);
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full select-none", ring && "ring-4 ring-surface", className)}
      style={{ width: size, height: size, background: `color-mix(in srgb, ${p.from} 18%, var(--surface))`, color: `color-mix(in srgb, ${p.ink} 85%, var(--ink))` }}
      title={user.name}
    >
      <span className="font-semibold tracking-tight" style={{ fontSize: Math.max(10, size * 0.38) }}>
        {initials(user.name)}
      </span>
      {user.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" loading="lazy" width={size} height={size} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  );
}
