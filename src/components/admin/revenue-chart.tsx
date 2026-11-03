"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "motion/react";
import { formatDate, formatNumber } from "@/lib/utils";

export function RevenueChart({ data }: { data: { date: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mt-6">
      <div className="flex h-56 items-end gap-[3px] sm:gap-1.5">
        {data.map((d, i) => (
          <Tooltip.Root key={d.date}>
            <Tooltip.Trigger asChild>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
                transition={{ delay: i * 0.015, type: "spring", stiffness: 140, damping: 18 }}
                className="flex-1 rounded-t-md transition-opacity hover:opacity-80"
                style={{ background: d.value ? "linear-gradient(180deg,#a993ff,#6d4aff)" : "var(--line)" }}
              />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content sideOffset={6} className="z-50 rounded-xl bg-[#16122b] px-3 py-2 text-xs font-bold text-white shadow-xl">
                {formatDate(d.date + "T12:00:00", { day: "numeric", month: "short" })} · {formatNumber(d.value)} FCFA
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs font-bold text-muted">
        <span>{formatDate(data[0].date + "T12:00:00", { day: "numeric", month: "short" })}</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
}
