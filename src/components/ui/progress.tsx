import { cn } from "@/lib/utils";

export function ProgressBar({ value, className, color = "var(--brand)", height = 10, track }: { value: number; className?: string; color?: string; height?: number; track?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-full", className)} style={{ height, background: track ?? "var(--line)" }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      >
        <div className="absolute inset-x-1.5 top-[2px] h-[30%] rounded-full bg-white/35" />
      </div>
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 8, color = "var(--brand)", track = "var(--line)", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, value)) / 100) * c}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
