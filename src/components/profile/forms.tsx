"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { changePassword, updatePreferences, updateProfile } from "@/app/actions/profile";
import type { FormState } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PALETTE_KEYS, gradient } from "@/lib/colors";
import { CURRENCIES, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

function useToastState(state: FormState) {
  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.ok) toast.success(state.message ?? "Enregistré");
  }, [state]);
}

const EMOJIS = ["🦊", "🐼", "🦁", "🐯", "🐨", "🐸", "🦉", "🐙", "🦄", "🐳", "🐝", "🦋", "🐢", "🐧", "🦒", "🐬", "🌻", "⚡", "🚀", "🎧"];

type U = { name: string; username: string; headline: string; bio: string; country: string; website: string; avatarEmoji: string; avatarColor: string; avatarUrl: string | null };

export function ProfileForm({ user }: { user: U }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  useToastState(state);
  const [emoji, setEmoji] = useState(user.avatarEmoji);
  const [color, setColor] = useState(user.avatarColor);
  const [preview, setPreview] = useState<string | null>(user.avatarUrl);
  const [remove, setRemove] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="avatarEmoji" value={emoji} />
      <input type="hidden" name="avatarColor" value={color} />
      <input type="hidden" name="removeAvatar" value={remove ? "1" : "0"} />
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-3">
          <Avatar user={{ name: user.name, avatarEmoji: emoji, avatarColor: color, avatarUrl: remove ? null : preview }} size={112} />
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
          <Button type="button" variant="soft" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Photo
          </Button>
          {preview && !remove && (
            <button type="button" className="text-xs font-bold text-coral hover:underline" onClick={() => { setRemove(true); if (fileRef.current) fileRef.current.value = ""; }}>
              Utiliser l'emoji
            </button>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm font-bold">Avatar emoji</p>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className={cn("grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:scale-110", emoji === e ? "bg-brand-soft ring-2 ring-brand" : "bg-surface-2")}>
                {e}
              </button>
            ))}
          </div>
          <p className="pt-2 text-sm font-bold">Couleur</p>
          <div className="flex flex-wrap gap-2">
            {PALETTE_KEYS.map((k) => (
              <button key={k} type="button" onClick={() => setColor(k)} className={cn("h-9 w-9 rounded-full transition hover:scale-110", color === k && "ring-4 ring-brand/40 ring-offset-2 ring-offset-surface")} style={{ background: gradient(k) }} aria-label={k} />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom complet"><Input name="name" defaultValue={user.name} required /></Field>
        <Field label="Nom d'utilisateur" hint="Ton profil : /u/nom"><Input name="username" defaultValue={user.username} required /></Field>
        <Field label="Titre" hint="Ex. Étudiante en design, Dev junior…"><Input name="headline" defaultValue={user.headline} maxLength={80} /></Field>
        <Field label="Pays"><Input name="country" defaultValue={user.country} /></Field>
      </div>
      <Field label="Bio"><Textarea name="bio" defaultValue={user.bio} maxLength={600} placeholder="Ce que tu apprends, ce qui te passionne…" /></Field>
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
        <p className="mb-3 text-sm font-bold">Objectif quotidien</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {[5, 10, 15, 20, 30, 45, 60].map((m) => (
            <button key={m} type="button" onClick={() => setG(m)} className={cn("rounded-2xl border-2 py-3 font-display font-extrabold transition", g === m ? "border-brand bg-brand-soft text-brand shadow-[0_3px_0_var(--brand)]" : "border-line hover:border-line-strong")}>
              {m}′
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-bold">Devise d'affichage des prix</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(CURRENCIES) as Currency[]).map((k) => (
            <button key={k} type="button" onClick={() => setC(k)} className={cn("flex items-center gap-3 rounded-2xl border-2 p-3 text-left font-bold transition", c === k ? "border-brand bg-brand-soft" : "border-line hover:border-line-strong")}>
              <span className="text-2xl">{CURRENCIES[k].flag}</span> {CURRENCIES[k].name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-bold">Thème</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["light", "☀️ Clair"],
            ["dark", "🌙 Sombre"],
            ["system", "💻 Système"],
          ].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTheme(k)} className={cn("rounded-2xl border-2 p-3 font-bold transition", theme === k ? "border-brand bg-brand-soft" : "border-line hover:border-line-strong")}>
              {l}
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
