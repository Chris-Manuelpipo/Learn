import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, text, action, className }: { eyebrow?: string; title: ReactNode; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">{eyebrow}</p>}
        <h2 className="text-3xl font-bold sm:text-[2.25rem] sm:leading-tight">{title}</h2>
        {text && <p className="mt-3 text-lg text-muted">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {text && <p className="mt-1 text-muted">{text}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
