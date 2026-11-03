"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Reward } from "@/lib/progression";

type Ctx = { celebrate: (reward: Reward | null | undefined, opts?: { big?: boolean }) => void };
const CelebrationContext = createContext<Ctx>({ celebrate: () => {} });
export const useCelebrate = () => useContext(CelebrationContext).celebrate;

export function fireConfetti(intense = false) {
  const css = getComputedStyle(document.documentElement);
  const colors = [css.getPropertyValue("--brand").trim(), css.getPropertyValue("--brand-2").trim(), "#ffc23d", "#ff6b57", "#3ba8ff"].filter(Boolean);
  confetti({ particleCount: intense ? 160 : 80, spread: intense ? 100 : 70, origin: { y: 0.65 }, colors, scalar: 1.1 });
  if (intense) {
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 350);
  }
}

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<Reward | null>(null);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const celebrate = useCallback((reward: Reward | null | undefined, opts?: { big?: boolean }) => {
    if (!reward) return;
    if (reward.badges.length || reward.levelUp || opts?.big) {
      setModal(reward);
      fireConfetti(true);
    } else if (reward.xp > 0) {
      toast(`+${reward.xp} XP`, {
        icon: "⚡",
        description: reward.streak > 1 ? `Série de ${reward.streak} jours 🔥` : "Continue comme ça !",
        duration: 2200,
      });
    }
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModal(null)}
          >
            <motion.div
              role="dialog"
              aria-modal
              className="card relative w-full max-w-md overflow-hidden p-8 text-center"
              initial={{ scale: 0.7, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/20 to-transparent" />
              {modal.levelUp ? (
                <>
                  <motion.div
                    className="relative mx-auto mb-4 grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br from-grad-a to-grad-b text-5xl font-extrabold text-white shadow-[var(--shadow-pop)]"
                    initial={{ rotate: -20, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.15 }}
                  >
                    <span className="font-display">{modal.levelUp}</span>
                  </motion.div>
                  <h2 className="text-3xl font-extrabold">Niveau supérieur !</h2>
                  <p className="mt-2 text-muted">Tu passes au niveau {modal.levelUp}. Ton cerveau te remercie 🧠</p>
                </>
              ) : (
                <>
                  <div className="relative mx-auto mb-3 text-6xl">🎉</div>
                  <h2 className="text-3xl font-extrabold">Bravo !</h2>
                </>
              )}
              {modal.badges.length > 0 && (
                <div className="mt-6 space-y-3">
                  {modal.badges.map((b, i) => (
                    <motion.div
                      key={b.name}
                      className="flex items-center gap-4 rounded-2xl border-2 border-line bg-surface-2 p-3 text-left"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.12 }}
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sun/20 text-3xl">{b.emoji}</span>
                      <span>
                        <span className="block text-xs font-extrabold uppercase tracking-wider text-brand">Nouveau badge</span>
                        <span className="block font-extrabold">{b.name}</span>
                        <span className="block text-sm text-muted">{b.description}</span>
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sun/20 px-4 py-2 font-extrabold text-[#9a6200] dark:text-sun">
                ⚡ +{modal.xp} XP {modal.streak > 1 && <span className="ml-1">· 🔥 {modal.streak} jours</span>}
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={() => setModal(null)}>
                Continuer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
}
