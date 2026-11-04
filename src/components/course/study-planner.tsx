"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const OPTIONS = [
  { m: 10, label: "Léger" },
  { m: 15, label: "Régulier" },
  { m: 30, label: "Soutenu" },
  { m: 60, label: "Intensif" },
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
    <section className="card p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">Temps estimé</p>
      <h2 className="mt-1 text-2xl font-bold">Planifiez votre apprentissage</h2>
      <p className="mt-1 text-muted">Indiquez le temps que vous pouvez y consacrer : nous estimons votre date de fin.</p>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {OPTIONS.map((o) => (
          <button
            key={o.m}
            onClick={() => setMinutes(o.m)}
            className={cn("rounded-xl border p-3 text-left transition", minutes === o.m ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line hover:border-line-strong")}
          >
            <span className="block text-lg font-bold">{o.m} min</span>
            <span className="text-xs text-muted">par jour · {o.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-1 text-muted">Jours par semaine</span>
        {[3, 5, 7].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={cn("h-9 rounded-lg px-3.5 font-semibold transition", days === d ? "bg-brand text-on-brand" : "bg-surface-2 text-ink-soft hover:bg-line")}>
            {d}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-3">
        <Stat value={`${sessions}`} label="séances" />
        <Stat value={weeks === 1 ? "1 semaine" : `${weeks} semaines`} label="environ" />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-ink">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-muted">Fin estimée</p>
            <p className="font-bold">{formatDate(end, { day: "numeric", month: "long" })}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
