import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-brand text-white [--chunk:#4422d6] dark:[--chunk:#3b1fc0] btn-chunky",
  secondary: "bg-surface text-ink border-2 border-line-strong [--chunk:var(--line-strong)] btn-chunky",
  mint: "bg-mint text-[#063d2e] [--chunk:#0ea47b] btn-chunky",
  sun: "bg-sun text-[#4a2f00] [--chunk:#d99a0b] btn-chunky",
  coral: "bg-coral text-white [--chunk:#d6402c] btn-chunky",
  ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
  soft: "bg-brand-soft text-brand-ink hover:brightness-95",
  danger: "bg-red-500 text-white [--chunk:#b91c1c] btn-chunky",
} as const;

const SIZES = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[0.95rem] rounded-2xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
  icon: "h-10 w-10 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center font-bold whitespace-nowrap select-none transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
});
