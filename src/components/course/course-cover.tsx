import { cn } from "@/lib/utils";
import { palette } from "@/lib/colors";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Couverture générée : dégradé, motif géométrique et emoji « sticker ». */
export function CourseCover({ course, className, size = "md" }: { course: { slug: string; emoji: string; color: string; coverUrl?: string | null; title: string }; className?: string; size?: "sm" | "md" | "lg" }) {
  const p = palette(course.color);
  const h = hash(course.slug);
  const variant = h % 4;
  const rot = (h % 24) - 12;

  if (course.coverUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={course.coverUrl} alt={course.title} className="h-full w-full object-cover" />
      </div>
    );
  }

  const emojiSize = size === "lg" ? "text-8xl sm:text-9xl" : size === "sm" ? "text-4xl" : "text-6xl";

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} aria-hidden>
      <svg className="absolute inset-0 h-full w-full opacity-[0.22]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 250">
        {variant === 0 && (
          <g fill="white">
            <circle cx="340" cy="40" r="70" />
            <circle cx="40" cy="230" r="50" opacity=".6" />
            <circle cx="300" cy="230" r="18" />
          </g>
        )}
        {variant === 1 && (
          <g stroke="white" strokeWidth="14" fill="none" strokeLinecap="round">
            <path d="M-20 200 Q 100 120 200 200 T 420 200" />
            <path d="M-20 60 Q 100 -20 200 60 T 420 60" opacity=".5" />
          </g>
        )}
        {variant === 2 && (
          <g fill="white">
            {Array.from({ length: 6 }).map((_, r) =>
              Array.from({ length: 10 }).map((_, c) => <circle key={`${r}-${c}`} cx={c * 44 + (r % 2) * 22} cy={r * 44 + 10} r="5" />),
            )}
          </g>
        )}
        {variant === 3 && (
          <g fill="white">
            <rect x="260" y="-40" width="180" height="180" rx="40" transform="rotate(20 350 50)" />
            <rect x="-40" y="160" width="120" height="120" rx="30" transform="rotate(-15 20 220)" opacity=".6" />
          </g>
        )}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_55%)]" />
      <div className="absolute inset-0 grid place-items-center">
        <span
          className={cn("drop-shadow-[0_10px_18px_rgba(0,0,0,.25)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-0", emojiSize)}
          style={{ transform: `rotate(${rot}deg)` }}
        >
          {course.emoji}
        </span>
      </div>
    </div>
  );
}
