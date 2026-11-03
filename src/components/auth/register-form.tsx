"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const EMOJIS = ["🦊", "🐼", "🦁", "🐯", "🐨", "🐸", "🦉", "🐙", "🦄", "🐳", "🐝", "🦋", "🐢", "🐧", "🦒", "🐬", "🌻", "⚡", "🚀", "🎧"];
const GOALS = [
  { m: 5, label: "Découverte", emoji: "🌱", text: "5 min / jour" },
  { m: 15, label: "Régulier", emoji: "🔥", text: "15 min / jour" },
  { m: 30, label: "Sérieux", emoji: "💪", text: "30 min / jour" },
  { m: 60, label: "Intense", emoji: "🚀", text: "1 h / jour" },
];

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(register, undefined);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: "", email: "", password: "", avatarEmoji: "🦊", dailyGoalMinutes: 15 });
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = [data.password.length >= 8, /\d/.test(data.password), /[A-Z]/.test(data.password), /[^A-Za-z0-9]/.test(data.password)].filter(Boolean).length;

  const nextStep = () => {
    setError(null);
    if (step === 0) {
      if (data.name.trim().length < 2) return setError("Comment doit-on t'appeler ?");
      if (!/^\S+@\S+\.\S+$/.test(data.email)) return setError("Cette adresse email ne semble pas valide.");
      if (data.password.length < 8 || !/\d/.test(data.password)) return setError("Mot de passe : 8 caractères minimum dont un chiffre.");
    }
    setStep(step + 1);
  };

  const titles = [
    ["✨", "Crée ton compte", "Gratuit, sans carte bancaire. Commence à apprendre en 1 minute."],
    ["🎨", "Choisis ton avatar", "Il t'accompagnera dans le classement et sur tes certificats… enfin presque !"],
    ["🎯", "Ton objectif quotidien", "Les petites habitudes font les grandes réussites. Tu pourras le changer plus tard."],
  ][step];

  return (
    <form action={action}>
      {Object.entries(data).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="mb-8 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Retour">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-1 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#7c5cff] to-[#ff5fa2]" animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.4 }} />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          <p className="text-5xl">{titles[0]}</p>
          <h1 className="mt-4 text-4xl font-extrabold">{titles[1]}</h1>
          <p className="mt-2 text-muted">{titles[2]}</p>

          {step === 0 && (
            <div className="mt-8 space-y-5">
              <Field label="Prénom et nom" htmlFor="r-name">
                <Input id="r-name" autoComplete="name" icon={<User className="h-5 w-5" />} placeholder="Alex Nkoulou" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="r-email">
                <Input id="r-email" type="email" autoComplete="email" icon={<Mail className="h-5 w-5" />} placeholder="toi@exemple.com" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
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
                    <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < strength ? ["bg-coral", "bg-sun", "bg-sky", "bg-mint"][strength - 1] : "bg-line")} />
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="mt-8">
              <div className="mb-6 flex justify-center">
                <motion.div key={data.avatarEmoji} initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#ff5fa2] text-6xl shadow-[var(--shadow-pop)]">
                  {data.avatarEmoji}
                </motion.div>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setData({ ...data, avatarEmoji: e })}
                    className={cn("grid aspect-square place-items-center rounded-2xl border-2 text-3xl transition hover:scale-110", data.avatarEmoji === e ? "border-brand bg-brand-soft" : "border-line bg-surface")}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 grid gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.m}
                  type="button"
                  onClick={() => setData({ ...data, dailyGoalMinutes: g.m })}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition",
                    data.dailyGoalMinutes === g.m ? "border-brand bg-brand-soft shadow-[0_4px_0_var(--brand)]" : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <span className="text-3xl">{g.emoji}</span>
                  <span className="flex-1 font-extrabold">{g.label}</span>
                  <span className="text-sm font-bold text-muted">{g.text}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {(error || state?.error) && <p className="mt-5 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{error ?? state?.error}</p>}

      {step < 2 ? (
        <Button key="next" type="button" size="lg" className="mt-8 w-full" onClick={nextStep}>
          Continuer
        </Button>
      ) : (
        <Button key="submit" type="submit" size="lg" variant="mint" className="mt-8 w-full" loading={pending}>
          C'est parti ! 🚀
        </Button>
      )}
    </form>
  );
}
