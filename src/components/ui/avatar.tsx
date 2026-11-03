import { cn } from "@/lib/utils";
import { gradient } from "@/lib/colors";

type U = { name: string; avatarUrl?: string | null; avatarEmoji?: string | null; avatarColor?: string | null };

export function Avatar({ user, size = 40, className, ring }: { user: U; size?: number; className?: string; ring?: boolean }) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full select-none", ring && "ring-4 ring-surface", className)}
      style={{ width: size, height: size, background: gradient(user.avatarColor) }}
      title={user.name}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.52, lineHeight: 1 }}>{user.avatarEmoji ?? "🦊"}</span>
      )}
    </span>
  );
}
