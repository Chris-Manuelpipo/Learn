"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CalendarCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const OPTIONS = [
  { m: 10, label: "Tranquille", emoji: "🐢" },
  { m: 15, label: "Régulier", emoji: "🚶" },
  { m: 30, label: "Motivé", emoji: "🏃" },
  { m: 60, label: "Intensif", emoji: "🚀" },
];

/** Estime la date de fin selon le temps d'apprentissage quotidien choisi. */
export function StudyPlanner({ totalMinutes, defaultMinutes }: { totalMinutes: number; defaultMinutes: number }) {
  const [minutes, setMinutes] = useState(OPTIONS.find((o) => o.m === defaultMinutes)?.m ?? 15);
  const [days, setDays] = useState(5);
  // On compte un peu de temps de révision et de pratique en plus des vidéos.
  const effective = Math.round(totalMinutes * 1.25);
  const sessions = Math.ceil(effective / minutes);
  const weeks = Math.max(1, Math.ceil(sessions / days));
  const end = new Date(Date.now() + Math.ceil((sessions / days) * 7) * 86400000);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border-2 border-brand/20 bg-gradient-to-br from-brand-soft to-surface p-6 sm:p-8">
      <div className="absolute -right-6 -top-6 text-8xl opacity-10">⏱️</div>
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand">Temps estimé</p>
      <h2 className="mt-1 text-2xl font-extrabold">Planifie ton apprentissage</h2>
      <p className="mt-1 text-muted">Combien de temps veux-tu y consacrer ? On calcule pour toi.</p>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {OPTIONS.map((o) => (
          <button
            key={o.m}
            onClick={() => setMinutes(o.m)}
            className={cn(
              "rounded-2xl border-2 p-3 text-left transition",
              minutes === o.m ? "border-brand bg-surface shadow-[0_4px_0_var(--brand)]" : "border-line bg-surface/60 hover:border-line-strong",
            )}
          >
            <span className="text-2xl">{o.emoji}</span>
            <span className="mt-1 block font-display text-lg font-extrabold">{o.m} min/j</span>
            <span className="text-xs font-bold text-muted">{o.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <span className="text-muted">Jours par semaine :</span>
        {[3, 5, 7].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={cn("h-9 rounded-xl px-3.5 font-extrabold transition", days === d ? "bg-brand text-white" : "bg-surface text-ink-soft hover:bg-surface-2")}>
            {d} j
          </button>
        ))}
      </div>

      <motion.div key={`${minutes}-${days}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat value={`${sessions}`} label="sessions" />
        <Stat value={weeks === 1 ? "1 sem." : `${weeks} sem.`} label="environ" />
        <div className="flex items-center gap-3 rounded-2xl bg-mint/15 p-4">
          <CalendarCheck className="h-8 w-8 shrink-0 text-mint" />
          <div>
            <p className="text-xs font-bold text-muted">Fin estimée</p>
            <p className="font-display font-extrabold">{formatDate(end, { day: "numeric", month: "long" })}</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="font-display text-3xl font-extrabold text-brand">{value}</p>
      <p className="text-xs font-bold text-muted">{label}</p>
    </div>
  );
}
