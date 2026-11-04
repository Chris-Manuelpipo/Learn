"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const GOALS = [
  { m: 5, label: "Découverte", text: "5 min par jour" },
  { m: 15, label: "Régulier", text: "15 min par jour" },
  { m: 30, label: "Soutenu", text: "30 min par jour" },
  { m: 60, label: "Intensif", text: "1 h par jour" },
];

const STEPS = [
  ["Créer un compte", "Gratuit, sans carte bancaire. Commencez à apprendre en une minute."],
  ["Votre objectif quotidien", "Un objectif réaliste, tenu chaque jour, fait la différence. Vous pourrez le modifier à tout moment."],
] as const;

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: "", email: "", password: "", dailyGoalMinutes: 15 });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = [data.password.length >= 8, /\d/.test(data.password), /[A-Z]/.test(data.password), /[^A-Za-z0-9]/.test(data.password)].filter(Boolean).length;

  const nextStep = () => {
    setError(null);
    if (data.name.trim().length < 2) return setError("Indiquez votre nom.");
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return setError("Cette adresse email ne semble pas valide.");
    if (data.password.length < 8 || !/\d/.test(data.password)) return setError("Le mot de passe doit contenir au moins 8 caractères dont un chiffre.");
    setStep(1);
  };

  return (
    <form action={action}>
      {Object.entries(data).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="mb-8 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(0)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-surface-2" aria-label="Retour">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <p className="text-sm font-medium text-muted">Étape {step + 1} sur 2</p>
        <div className="flex flex-1 gap-1.5">
          {[0, 1].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-line")} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          <h1 className="text-3xl font-bold">{STEPS[step][0]}</h1>
          <p className="mt-2 text-muted">{STEPS[step][1]}</p>

          {step === 0 ? (
            <div className="mt-8 space-y-5">
              <Field label="Nom complet" htmlFor="r-name">
                <Input id="r-name" autoComplete="name" icon={<User className="h-5 w-5" />} placeholder="Alex Nkoulou" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="r-email">
                <Input id="r-email" type="email" autoComplete="email" icon={<Mail className="h-5 w-5" />} placeholder="vous@exemple.com" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
              </Field>
              <Field label="Mot de passe" htmlFor="r-password">
                <div className="relative">
                  <Input id="r-password" type={show ? "text" : "password"} autoComplete="new-password" icon={<Lock className="h-5 w-5" />} placeholder="8 caractères dont un chiffre" value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={show ? "Masquer" : "Afficher"}>
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < strength ? ["bg-coral", "bg-sun", "bg-brand-2", "bg-brand"][strength - 1] : "bg-line")} />
                  ))}
                </div>
              </Field>
            </div>
          ) : (
            <div className="mt-8 grid gap-2.5">
              {GOALS.map((g) => (
                <button
                  key={g.m}
                  type="button"
                  onClick={() => setData({ ...data, dailyGoalMinutes: g.m })}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition",
                    data.dailyGoalMinutes === g.m ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-line hover:border-line-strong",
                  )}
                >
                  <span className="font-semibold">{g.label}</span>
                  <span className="text-sm text-muted">{g.text}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {(error || state?.error) && <p className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{error ?? state?.error}</p>}

      {step === 0 ? (
        <Button key="next" type="button" size="lg" className="mt-8 w-full" onClick={nextStep}>
          Continuer
        </Button>
      ) : (
        <Button key="submit" type="submit" size="lg" className="mt-8 w-full" loading={pending}>
          Créer mon compte
        </Button>
      )}
    </form>
  );
}
