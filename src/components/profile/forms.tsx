"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Monitor, Moon, Sun, Upload } from "lucide-react";
import { changePassword, updatePreferences, updateProfile } from "@/app/actions/profile";
import type { FormState } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PALETTE_KEYS, palette } from "@/lib/colors";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

function useToastState(state: FormState) {
  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.ok) toast.success(state.message ?? "Enregistré");
  }, [state]);
}

const choice = (active: boolean) =>
  cn("rounded-xl border p-3 text-sm font-medium transition", active ? "border-brand bg-brand-soft text-brand-ink ring-1 ring-brand" : "border-line hover:border-line-strong");

type U = { name: string; username: string; headline: string; bio: string; country: string; website: string; avatarColor: string; avatarUrl: string | null };

export function ProfileForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  useToastState(state);
  const [color, setColor] = useState(user.avatarColor);
  const [preview, setPreview] = useState<string | null>(user.avatarUrl);
  const [remove, setRemove] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shown = remove ? null : preview;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="avatarColor" value={color} />
      <input type="hidden" name="removeAvatar" value={remove ? "1" : "0"} />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar user={{ name: user.name, avatarColor: color, avatarUrl: shown }} size={96} />
        <div className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setPreview(URL.createObjectURL(f));
                setRemove(false);
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> {shown ? "Changer la photo" : "Ajouter une photo"}
            </Button>
            {shown && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRemove(true);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Retirer
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">PNG, JPG ou WebP, 2 Mo maximum. Sans photo, vos initiales sont affichées.</p>
          {!shown && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Couleur des initiales</span>
              {PALETTE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setColor(k)}
                  className={cn("h-6 w-6 rounded-full transition", color === k && "ring-2 ring-brand ring-offset-2 ring-offset-surface")}
                  style={{ background: palette(k).from }}
                  aria-label={k}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet"><Input name="name" defaultValue={user.name} required /></Field>
        <Field label="Nom d'utilisateur" hint="Adresse de votre profil : /u/nom"><Input name="username" defaultValue={user.username} required /></Field>
        <Field label="Titre" hint="Ex. Étudiante en design, Développeur junior…"><Input name="headline" defaultValue={user.headline} maxLength={80} /></Field>
        <Field label="Pays"><Input name="country" defaultValue={user.country} /></Field>
      </div>
      <Field label="Bio"><Textarea name="bio" defaultValue={user.bio} maxLength={600} placeholder="Votre parcours, ce que vous apprenez, ce qui vous intéresse…" /></Field>
      <Field label="Site web ou LinkedIn"><Input name="website" defaultValue={user.website} placeholder="https://" /></Field>
      <Button type="submit" loading={pending}>Enregistrer le profil</Button>
    </form>
  );
}

export function PreferencesForm({ goal, currency }: { goal: number; currency: string }) {
  const [state, action, pending] = useActionState(updatePreferences, undefined);
  useToastState(state);
  const [g, setG] = useState(goal);
  const [c, setC] = useState(currency);
  const { theme, setTheme } = useTheme();
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="dailyGoalMinutes" value={g} />
      <input type="hidden" name="currency" value={c} />
      <div>
        <p className="mb-3 text-sm font-semibold">Objectif quotidien</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {[5, 10, 15, 20, 30, 45, 60].map((m) => (
            <button key={m} type="button" onClick={() => setG(m)} className={choice(g === m)}>
              {m} min
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">Devise d'affichage des prix</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(CURRENCIES) as Currency[]).map((k) => (
            <button key={k} type="button" onClick={() => setC(k)} className={cn(choice(c === k), "flex items-center gap-3 text-left")}>
              <span className="font-mono text-xs font-semibold text-muted">{k}</span> {CURRENCIES[k].name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">Thème</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["light", "Clair", Sun],
              ["dark", "Sombre", Moon],
              ["system", "Système", Monitor],
            ] as const
          ).map(([k, l, ThemeIcon]) => (
            <button key={k} type="button" onClick={() => setTheme(k)} className={cn(choice(theme === k), "flex items-center justify-center gap-2")}>
              <ThemeIcon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" loading={pending}>Enregistrer</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  useToastState(state);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <Field label="Mot de passe actuel"><Input name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="Nouveau mot de passe" hint="8 caractères minimum dont un chiffre"><Input name="next" type="password" autoComplete="new-password" required /></Field>
      <div><Button type="submit" variant="secondary" loading={pending}>Changer le mot de passe</Button></div>
    </form>
  );
}
