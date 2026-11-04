"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, GraduationCap, X, Zap } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

const STEPS = [
  { icon: Zap, title: "Gagnez de l'XP", text: "à chaque leçon terminée et chaque quiz réussi." },
  { icon: CalendarCheck, title: "Entretenez votre série", text: "en apprenant quelques minutes chaque jour." },
  { icon: GraduationCap, title: "Obtenez vos certificats", text: "en réussissant l'examen final de chaque formation." },
];

/** Bandeau d'accueil affiché une fois, juste après l'inscription. */
export function WelcomeBanner({ name }: { name: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    window.history.replaceState(null, "", "/dashboard");
  }, []);
  if (!open) return null;

  return (
    <section className="card relative mb-8 p-6 sm:p-8">
      <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Fermer">
        <X className="h-4 w-4" />
      </button>
      <h2 className="text-xl font-bold">Bienvenue sur Learn, {name}</h2>
      <p className="mt-1 text-muted">Votre compte est prêt. Voici comment tirer le meilleur parti de la plateforme.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
              <s.icon className="h-5 w-5" />
            </span>
            <p className="text-sm">
              <span className="block font-semibold">{s.title}</span>
              <span className="text-muted">{s.text}</span>
            </p>
          </div>
        ))}
      </div>
      <Link href="/courses?price=free" className={buttonClass("primary", "md", "mt-6")}>
        Choisir une première formation
      </Link>
    </section>
  );
}
