import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--grad-a)" }} />
          <stop offset="1" style={{ stopColor: "var(--grad-b)" }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-g)" />
      <path d="M22 16v26a6 6 0 0 0 6 6h16" stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="45" cy="20" r="6" fill="#FFC23D" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Learn — accueil">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
      <span className="text-2xl font-bold tracking-tight">learn</span>
    </Link>
  );
}
