import { cn } from "@/lib/utils";
import { palette } from "@/lib/colors";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Redimensionne une photo Unsplash à la largeur utile (16:10), sans toucher aux autres URL. */
export function coverSrc(url: string, width: number) {
  if (!url.includes("images.unsplash.com")) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("h", String(Math.round(width * 0.625)));
  return u.toString();
}

const WIDTHS = { sm: 240, md: 640, lg: 1200 } as const;

/** Photo de couverture ; le motif coloré, rendu dessous, sert de repli si la photo manque ou ne charge pas. */
export function CourseCover({
  course,
  className,
  size = "md",
  priority,
}: {
  course: { slug: string; color: string; coverUrl?: string | null; title: string };
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
}) {
  const p = palette(course.color);
  const variant = hash(course.slug) % 3;

  return (
    <div className={cn("relative isolate overflow-hidden bg-surface-2", className)}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} aria-hidden>
        <svg className="absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 250">
          {variant === 0 && (
            <g fill="white">
              <circle cx="340" cy="40" r="70" />
              <circle cx="40" cy="230" r="50" opacity=".6" />
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
                Array.from({ length: 10 }).map((_, c) => <circle key={`${r}-${c}`} cx={c * 44 + (r % 2) * 22} cy={r * 44 + 10} r="4" />),
              )}
            </g>
          )}
        </svg>
      </div>
      {course.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc(course.coverUrl, WIDTHS[size])}
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}
