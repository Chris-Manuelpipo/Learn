"use client";

import { useActionState } from "react";
import { applyInstructor } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

export function ApplicationForm() {
  const [state, action, pending] = useActionState(applyInstructor, undefined);
  if (state?.ok) {
    return (
      <div className="card p-8 text-center">
        <p className="text-6xl">🚀</p>
        <h2 className="mt-4 text-2xl font-extrabold">Candidature envoyée !</h2>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <h2 className="text-2xl font-extrabold">Ta candidature</h2>
      <Field label="Domaine d'expertise"><Input name="expertise" placeholder="Développement web, design, finance…" required /></Field>
      <Field label="Expérience" hint="Ton parcours, tes réalisations, tes années d'expérience."><Textarea name="experience" required /></Field>
      <Field label="Motivation" hint="Quel cours aimerais-tu créer et pour qui ?"><Textarea name="motivation" required /></Field>
      <Field label="Portfolio ou LinkedIn (optionnel)"><Input name="portfolio" placeholder="https://" /></Field>
      {state?.error && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>Envoyer ma candidature</Button>
    </form>
  );
}
