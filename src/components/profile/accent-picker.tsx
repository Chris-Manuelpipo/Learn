"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { setAccentColor } from "@/app/actions/profile";
import { PALETTES, PALETTE_NAMES, type PaletteName } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/** Choix de la couleur d'accent : appliquée immédiatement, puis enregistrée sur le compte. */
export function AccentPicker({ current }: { current: PaletteName }) {
  const [active, setActive] = useState(current);
  const [, start] = useTransition();

  const choose = (name: PaletteName) => {
    const previous = active;
    setActive(name);
    document.documentElement.dataset.palette = name;
    start(async () => {
      const res = await setAccentColor(name);
      if (res.error) {
        setActive(previous);
        document.documentElement.dataset.palette = previous;
        toast.error(res.error);
      } else toast.success(`Couleur « ${PALETTES[name].label} » appliquée`);
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {PALETTE_NAMES.map((name) => {
        const { label, light, dark } = PALETTES[name];
        const a = "gradA" in light ? light.gradA : light.brand;
        const b = "gradB" in light ? light.gradB : light.brand2;
        const selected = active === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => choose(name)}
            aria-pressed={selected}
            className={cn(
              "group relative overflow-hidden rounded-2xl border bg-surface p-2 text-left transition hover:-translate-y-0.5",
              selected ? "border-brand ring-1 ring-brand" : "border-line hover:border-line-strong",
            )}
          >
            <span className="relative block h-16 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
              <span className="absolute bottom-2 left-2 rounded-lg px-2 py-1 text-[11px] font-bold shadow-sm" style={{ background: light.brand, color: light.onBrand }}>
                Bouton
              </span>
              <span className="absolute right-2 top-2 h-5 w-5 rounded-full ring-2 ring-white/80" style={{ background: dark.brand }} title="Mode sombre" />
              {selected && (
                <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-[#16161a] shadow">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
            </span>
            <span className="mt-2 block px-1 pb-0.5 text-sm font-bold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
