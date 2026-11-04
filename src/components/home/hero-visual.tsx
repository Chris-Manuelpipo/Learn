"use client";

import { motion } from "motion/react";
import { BadgeCheck, CircleCheck, Flame, GraduationCap, PlayCircle, QrCode } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-logo";
import { LOGOS } from "@/lib/brand-logos";

// Apparition unique, décalée : aucune animation ne tourne en boucle.
const enter = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

export function HeroVisual({ photo, instructorPhoto }: { photo: string; instructorPhoto: string | null }) {
  return (
    <div className="relative mx-auto aspect-[1/1.02] w-full max-w-[560px]">
      {/* Fond : panneau teinté et trame discrète */}
      <div className="absolute inset-x-[6%] inset-y-[4%] rounded-[2rem] bg-brand-soft" />
      <div className="bg-dots absolute inset-x-[6%] inset-y-[4%] rounded-[2rem] opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Carte principale : formation en cours */}
      <motion.div {...enter(0.1)} className="absolute left-[10%] top-[13%] w-[62%]">
        <div className="card overflow-hidden p-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.1rem] bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#16191c] shadow-sm">
              <BrandMark logo={LOGOS.react} size={13} /> Développement web
            </span>
            <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-[#16191c] shadow">
              <PlayCircle className="h-5 w-5" />
            </span>
          </div>
          <div className="px-3 pb-3 pt-3.5">
            <p className="text-[15px] font-bold leading-snug">React 19 : interfaces réactives</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              {instructorPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={instructorPhoto} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : null}
              Aïcha Mbarga
              <BadgeCheck className="h-3.5 w-3.5 text-brand" />
            </div>
            <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-brand" initial={{ width: 0 }} animate={{ width: "67%" }} transition={{ delay: 0.6, duration: 1, ease: "easeOut" }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-medium text-muted">
              <span>Leçon 16 sur 24</span>
              <span className="font-semibold text-ink-soft">67 %</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Série de jours */}
      <motion.div {...enter(0.25)} className="absolute right-[4%] top-[7%] w-[36%]">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-coral/12 text-coral">
              <Flame className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-lg font-bold leading-none">12 jours</p>
              <p className="mt-1 text-[11px] text-muted">de série</p>
            </div>
          </div>
          <div className="mt-3.5 flex justify-between">
            {WEEK.map((d, i) => (
              <span key={i} className="flex flex-col items-center gap-1">
                <span className={`h-2.5 w-2.5 rounded-full ${i < 5 ? "bg-coral" : "bg-line-strong"}`} />
                <span className="text-[9px] font-medium text-muted">{d}</span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quiz */}
      <motion.div {...enter(0.4)} className="absolute right-[2%] top-[42%] w-[42%]">
        <div className="card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Quiz · 3 sur 5</p>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug">À quoi sert le hook useState ?</p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-brand/40 bg-brand-soft px-2.5 py-1.5 text-[11px] font-semibold text-brand-ink">
              Gérer un état local
              <CircleCheck className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-muted">Appeler une API</div>
          </div>
        </div>
      </motion.div>

      {/* Certificat */}
      <motion.div {...enter(0.55)} className="absolute bottom-[6%] left-[3%] w-[46%]">
        <div className="card flex items-center gap-3 p-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun/18 text-[#a16207] dark:text-sun">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">Certificat délivré</p>
            <p className="truncate font-mono text-[10px] text-muted">LRN-8WJW-7UKM-C4D9</p>
          </div>
          <QrCode className="h-7 w-7 shrink-0 text-ink-soft" />
        </div>
      </motion.div>

      {/* Technologies enseignées */}
      <motion.div {...enter(0.7)} className="absolute bottom-[10%] right-[6%]">
        <div className="card flex items-center gap-3 py-2.5 pl-2.5 pr-4">
          <div className="flex -space-x-2">
            {[LOGOS.react, LOGOS.python, LOGOS.figma, LOGOS.javascript].map((logo) => (
              <span key={logo.title} className="grid h-8 w-8 place-items-center rounded-full bg-surface ring-2 ring-surface shadow-sm" title={logo.title}>
                <BrandMark logo={logo} size={16} />
              </span>
            ))}
          </div>
          <span className="text-[11px] font-semibold leading-tight">
            100 formations
            <span className="block font-normal text-muted">en français</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
