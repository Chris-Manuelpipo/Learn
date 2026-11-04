"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import { formatDate } from "@/lib/utils";

type Day = { date: string; xp: number; minutes: number };

const LEVELS = ["var(--surface-2)", "color-mix(in srgb, var(--brand) 25%, var(--surface))", "color-mix(in srgb, var(--brand) 50%, var(--surface))", "color-mix(in srgb, var(--brand) 78%, var(--surface))", "var(--brand)"];
const DARK_SAFE = "color-mix(in srgb, var(--line) 60%, transparent)";

function level(xp: number) {
  if (xp <= 0) return 0;
  if (xp < 20) return 1;
  if (xp < 50) return 2;
  if (xp < 100) return 3;
  return 4;
}

/** Calendrier d'activité façon « contributions », semaines en colonnes. */
export function ActivityHeatmap({ days }: { days: Day[] }) {
  const first = new Date(days[0].date + "T12:00:00");
  const offset = (first.getDay() + 6) % 7;
  const cells: (Day | null)[] = [...Array(offset).fill(null), ...days];
  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      <div className="no-scrollbar overflow-x-auto">
        <div className="flex min-w-max gap-[5px]">
          <div className="mr-1 grid grid-rows-7 gap-[5px] pt-0 text-[10px] font-bold text-muted">
            {["L", "", "M", "", "V", "", "D"].map((d, i) => (
              <span key={i} className="flex h-[15px] items-center">
                {d}
              </span>
            ))}
          </div>
          {weeks.map((w, wi) => (
            <div key={wi} className="grid grid-rows-7 gap-[5px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const d = w[di];
                if (!d) return <span key={di} className="h-[15px] w-[15px]" />;
                const lv = level(d.xp);
                return (
                  <Tooltip.Root key={di}>
                    <Tooltip.Trigger asChild>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: (wi * 7 + di) * 0.004 }}
                        className="block h-[15px] w-[15px] rounded-[4px]"
                        style={{ background: lv === 0 ? DARK_SAFE : LEVELS[lv] }}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content sideOffset={6} className="z-50 rounded-xl bg-night px-3 py-2 text-xs font-bold text-white shadow-xl">
                        {formatDate(d.date + "T12:00:00", { weekday: "long", day: "numeric", month: "long" })}
                        <br />
                        <span className="text-sun">{d.xp} XP</span> · {d.minutes} min
                        <Tooltip.Arrow className="fill-night" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] font-bold text-muted">
        Moins
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: l === 0 ? DARK_SAFE : LEVELS[l] }} />
        ))}
        Plus
      </div>
    </div>
  );
}

export function WeekBars({ days }: { days: Day[] }) {
  const max = Math.max(50, ...days.map((d) => d.xp));
  return (
    <div className="flex h-36 items-end gap-2 sm:gap-3">
      {days.map((d, i) => {
        const date = new Date(d.date + "T12:00:00");
        const isToday = i === days.length - 1;
        return (
          <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-bold text-muted">{d.xp > 0 ? d.xp : ""}</span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(4, (d.xp / max) * 100)}%` }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 120, damping: 16 }}
              className="w-full max-w-12 rounded-t-xl rounded-b-md"
              style={{ background: d.xp === 0 ? "var(--line)" : isToday ? "linear-gradient(180deg,var(--grad-b),var(--grad-a))" : "linear-gradient(180deg,color-mix(in srgb,var(--brand) 55%,white),var(--brand))" }}
            />
            <span className={`text-xs font-bold capitalize ${isToday ? "text-brand" : "text-muted"}`}>
              {isToday ? "Auj." : formatDate(date, { weekday: "short" }).replace(".", "")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
