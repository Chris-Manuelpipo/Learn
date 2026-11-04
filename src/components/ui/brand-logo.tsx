import type { BrandLogo } from "@/lib/brand-logos";

export function BrandMark({ logo, size = 20, mono, className }: { logo: BrandLogo; size?: number; mono?: boolean; className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" width={size} height={size} className={className} aria-label={logo.title}>
      <path d={logo.path} fill={mono ? "currentColor" : logo.hex} />
    </svg>
  );
}
