import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-brand text-on-brand hover:bg-brand-ink shadow-sm",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 hover:border-ink/25",
  mint: "bg-brand text-on-brand hover:bg-brand-ink shadow-sm",
  sun: "bg-sun text-[#3d2a00] hover:brightness-95 shadow-sm",
  coral: "bg-coral text-white hover:brightness-95 shadow-sm",
  ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
  soft: "bg-brand-soft text-brand-ink hover:brightness-[0.97]",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
} as const;

const SIZES = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[0.95rem] rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-2xl gap-2",
  icon: "h-10 w-10 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-colors duration-150 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
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
