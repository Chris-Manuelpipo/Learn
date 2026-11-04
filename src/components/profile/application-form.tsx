"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";
import { applyInstructor } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

export function ApplicationForm() {
  const [state, action, pending] = useActionState(applyInstructor, undefined);
  if (state?.ok) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink"><CircleCheck className="h-7 w-7" /></span>
        <h2 className="mt-4 text-2xl font-bold">Candidature envoyée</h2>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <h2 className="text-xl font-bold">Votre candidature</h2>
      <Field label="Domaine d'expertise"><Input name="expertise" placeholder="Développement web, design, finance…" required /></Field>
      <Field label="Expérience" hint="Votre parcours, vos réalisations, vos années d'expérience."><Textarea name="experience" required /></Field>
      <Field label="Motivation" hint="Quelle formation souhaitez-vous créer, et pour quel public ?"><Textarea name="motivation" required /></Field>
      <Field label="Portfolio ou LinkedIn (optionnel)"><Input name="portfolio" placeholder="https://" /></Field>
      {state?.error && <p className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={pending}>Envoyer ma candidature</Button>
    </form>
  );
}
