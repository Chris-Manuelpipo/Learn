"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, GraduationCap, Lock, Mail, Presentation, ShieldCheck } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const DEMO = [
  { label: "Étudiant", email: "etudiant@learn.dev", icon: GraduationCap },
  { label: "Formateur", email: "formateur@learn.dev", icon: Presentation },
  { label: "Admin", email: "admin@learn.dev", icon: ShieldCheck },
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
          <Input id="email" name="email" type="email" autoComplete="email" required icon={<Mail className="h-5 w-5" />} placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required icon={<Lock className="h-5 w-5" />} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-ink" aria-label={show ? "Masquer" : "Afficher"}>
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </Field>
        {state?.error && <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral">{state.error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Se connecter
        </Button>
      </form>
      <div className="mt-8 rounded-2xl border border-dashed border-line-strong p-4">
        <p className="mb-3 text-center text-xs font-medium text-muted">Comptes de démonstration · mot de passe Learn2026!</p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword("Learn2026!");
              }}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-2 px-2 py-3 text-center transition hover:bg-brand-soft hover:text-brand-ink"
            >
              <d.icon className="h-5 w-5" />
              <span className="text-xs font-semibold">{d.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
