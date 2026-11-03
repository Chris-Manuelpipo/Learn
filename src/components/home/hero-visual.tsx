"use client";

import { motion } from "motion/react";

const float = (delay: number, r = 0) => ({
  initial: { opacity: 0, y: 30, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay, type: "spring" as const, stiffness: 120, damping: 14 },
  style: { "--r": `${r}deg` } as React.CSSProperties,
});

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]">
      {/* Blobs */}
      <div className="absolute inset-[8%] rounded-[38%_62%_55%_45%/45%_40%_60%_55%] bg-gradient-to-br from-[#7c5cff] via-[#b26bff] to-[#ff5fa2] opacity-90 blur-[2px]" />
      <div className="absolute inset-[8%] rounded-[38%_62%_55%_45%/45%_40%_60%_55%] bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,.45),transparent_50%)]" />

      {/* Carte de cours */}
      <motion.div {...float(0.2)} className="absolute left-[14%] top-[18%] w-[58%]">
        <div className="animate-float card overflow-hidden p-2.5 [animation-delay:-1s]">
          <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-[#3ba8ff] to-[#5b6cff] text-6xl">⚛️</div>
          <div className="p-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand">Développement web</p>
            <p className="mt-1 font-display text-base font-extrabold leading-tight">React 19 : interfaces réactives</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#ff5fa2]" initial={{ width: 0 }} animate={{ width: "68%" }} transition={{ delay: 0.9, duration: 1.2 }} />
            </div>
            <p className="mt-1.5 text-right text-[11px] font-bold text-muted">68 % terminé</p>
          </div>
        </div>
      </motion.div>

      {/* Série */}
      <motion.div {...float(0.45, -6)} className="absolute right-[2%] top-[10%]">
        <div className="animate-float card flex items-center gap-3 px-4 py-3 [animation-delay:-3s]">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="font-display text-2xl font-extrabold leading-none text-coral">12</p>
            <p className="text-xs font-bold text-muted">jours de série</p>
          </div>
        </div>
      </motion.div>

      {/* XP */}
      <motion.div {...float(0.6, 5)} className="absolute right-[6%] top-[46%]">
        <div className="animate-float rounded-2xl bg-sun px-4 py-2.5 font-display text-lg font-extrabold text-[#4a2f00] shadow-[0_6px_0_#d99a0b] [animation-delay:-2s]">
          ⚡ +25 XP
        </div>
      </motion.div>

      {/* Quiz */}
      <motion.div {...float(0.75, 3)} className="absolute bottom-[8%] left-[2%] w-[46%]">
        <div className="animate-float card p-4 [animation-delay:-4s]">
          <p className="text-xs font-extrabold text-muted">Quiz · Question 3/5</p>
          <p className="mt-1 text-sm font-bold leading-snug">À quoi sert useState ?</p>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between rounded-xl border-2 border-mint bg-mint/10 px-3 py-1.5 text-xs font-bold">
              Gérer un état local <span>✅</span>
            </div>
            <div className="rounded-xl border-2 border-line px-3 py-1.5 text-xs font-semibold text-muted">Appeler une API</div>
          </div>
        </div>
      </motion.div>

      {/* Certificat */}
      <motion.div {...float(0.9, -4)} className="absolute bottom-[14%] right-[4%] w-[40%]">
        <div className="animate-float card p-4 text-center [animation-delay:-5s]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#ffc93d] to-[#ff9f1c] text-2xl">🎓</div>
          <p className="mt-2 font-display text-sm font-extrabold">Certificat obtenu</p>
          <p className="text-[11px] font-semibold text-muted">Vérifiable · QR code</p>
        </div>
      </motion.div>

      {/* Badge */}
      <motion.div {...float(1.05, 12)} className="absolute left-[4%] top-[6%]">
        <div className="animate-float grid h-16 w-16 place-items-center rounded-full bg-surface text-3xl shadow-[var(--shadow-pop)] ring-4 ring-mint/40 [animation-delay:-1.5s]">🎯</div>
      </motion.div>
    </div>
  );
}
