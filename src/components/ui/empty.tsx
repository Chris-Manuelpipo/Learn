import type { ReactNode } from "react";

export function EmptyState({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-20 w-20 animate-float place-items-center rounded-3xl bg-brand-soft text-4xl">{emoji}</div>
      <h3 className="text-xl font-extrabold">{title}</h3>
      {text && <p className="mt-2 max-w-md text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
