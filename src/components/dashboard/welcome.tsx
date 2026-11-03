"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { fireConfetti } from "@/components/gamification/celebration";
import { buttonClass } from "@/components/ui/button";

export function WelcomeCelebration({ name }: { name: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    fireConfetti(true);
    window.history.replaceState(null, "", "/dashboard");
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="card w-full max-w-lg p-8 text-center" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 16 }}>
            <p className="text-6xl">🎉</p>
            <h2 className="mt-4 text-3xl font-extrabold">Bienvenue, {name} !</h2>
            <p className="mt-3 text-muted">Ton compte est prêt. Voici comment Learn t'aide à progresser :</p>
            <div className="mt-6 grid gap-3 text-left">
              {[
                ["⚡", "Gagne de l'XP", "à chaque leçon terminée et chaque quiz réussi."],
                ["🔥", "Entretiens ta série", "en apprenant un peu chaque jour."],
                ["🎓", "Obtiens des certificats", "vérifiables en réussissant l'examen final."],
              ].map(([e, t, d]) => (
                <div key={t} className="flex items-center gap-4 rounded-2xl bg-surface-2 p-3">
                  <span className="text-3xl">{e}</span>
                  <p className="text-sm">
                    <span className="font-extrabold">{t}</span> <span className="text-muted">{d}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button onClick={() => setOpen(false)} className={buttonClass("secondary", "lg")}>
                Mon tableau de bord
              </button>
              <Link href="/courses?price=free" className={buttonClass("primary", "lg")}>
                Choisir un cours
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
