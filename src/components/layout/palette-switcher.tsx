"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Palette, X } from "lucide-react";
import { PALETTES, PALETTE_COOKIE, type PaletteName } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/** Sélecteur temporaire pour comparer les palettes en conditions réelles. */
export function PaletteSwitcher({ current }: { current: PaletteName }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(current);

  const choose = (name: PaletteName) => {
    setActive(name);
    document.documentElement.dataset.palette = name;
    document.cookie = `${PALETTE_COOKIE}=${name}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
      {open && (
        <div className="w-64 rounded-3xl border-2 border-line bg-surface p-3 shadow-[var(--shadow-pop)]">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-sm font-extrabold">Couleur principale</p>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted hover:text-ink" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
          {(Object.keys(PALETTES) as PaletteName[]).map((name) => {
            const p = PALETTES[name];
            return (
              <button
                key={name}
                onClick={() => choose(name)}
                className={cn("flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-sm font-bold transition", active === name ? "bg-surface-2 ring-2 ring-brand" : "hover:bg-surface-2")}
              >
                <span className="flex">
                  <span className="h-6 w-6 rounded-full ring-2 ring-surface" style={{ background: p.light.brand }} />
                  <span className="-ml-2 h-6 w-6 rounded-full ring-2 ring-surface" style={{ background: p.light.brand2 }} />
                  <span className="-ml-2 h-6 w-6 rounded-full ring-2 ring-surface" style={{ background: p.dark.brand }} />
                </span>
                {p.label}
              </button>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="grid h-12 w-12 place-items-center rounded-full bg-brand text-on-brand shadow-[var(--shadow-pop)] transition hover:scale-105"
        aria-label="Changer la couleur principale"
      >
        <Palette className="h-5 w-5" />
      </button>
    </div>
  );
}
