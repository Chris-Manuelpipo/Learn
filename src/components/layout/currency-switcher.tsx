"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { useTransition } from "react";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { setCurrency } from "@/app/actions/courses";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function CurrencySwitcher({ value }: { value: Currency }) {
  const [pending, start] = useTransition();
  return (
    <DM.Root>
      <DM.Trigger
        className={cn("hidden h-10 items-center gap-1 rounded-xl px-2.5 text-sm font-extrabold text-ink-soft transition hover:bg-surface-2 hover:text-ink sm:flex", pending && "opacity-50")}
        aria-label="Changer de devise"
      >
        {CURRENCIES[value].label}
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={8} className="z-[60] min-w-48 rounded-2xl border-2 border-line bg-surface p-1.5 shadow-[var(--shadow-pop)] data-[state=open]:animate-pop">
          <DM.Label className="px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-muted">Devise d'affichage</DM.Label>
          {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
            <DM.Item
              key={c}
              onSelect={() => start(() => setCurrency(c))}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none data-[highlighted]:bg-surface-2"
            >
              <span className="text-lg">{CURRENCIES[c].flag}</span>
              <span className="flex-1">
                {CURRENCIES[c].name} <span className="text-muted">({CURRENCIES[c].label})</span>
              </span>
              {c === value && <Check className="h-4 w-4 text-brand" />}
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
