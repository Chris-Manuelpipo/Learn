"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const DEMO = [
  { label: "Étudiant", email: "etudiant@learn.dev", emoji: "🦊" },
  { label: "Formateur", email: "formateur@learn.dev", emoji: "🧑‍🏫" },
  { label: "Admin", email: "admin@learn.dev", emoji: "🛰️" },
];

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState(state?.fields?.email ?? "");
  const [password, setPassword] = useState("");

  return (
    <>
      <form action={action} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required icon={<Mail className="h-5 w-5" />} placeholder="toi@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required icon={<Lock className="h-5 w-5" />} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={show ? "Masquer" : "Afficher"}>
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>
        {state?.error && <p className="animate-[wiggle_.5s] rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Se connecter
        </Button>
      </form>
      <div className="mt-8 rounded-3xl border-2 border-dashed border-line p-4">
        <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-wider text-muted">Comptes de démo · mot de passe Learn2026!</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword("Learn2026!");
              }}
              className="rounded-2xl bg-surface-2 px-2 py-3 text-center transition hover:-translate-y-0.5 hover:bg-brand-soft"
            >
              <span className="block text-2xl">{d.emoji}</span>
              <span className="mt-1 block text-xs font-extrabold">{d.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
