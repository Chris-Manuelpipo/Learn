"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createCourse, updateCourseInfo } from "@/app/actions/studio";
import { CourseCover } from "@/components/course/course-cover";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PALETTE_KEYS, gradient } from "@/lib/colors";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Initial = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: string;
  level: string;
  price: number;
  emoji: string;
  color: string;
  certified: boolean;
  outcomes: string[];
  requirements: string[];
  slug: string;
};

const EMOJIS = ["📘", "💻", "⚛️", "🐍", "🎨", "🚀", "📊", "🧠", "🗣️", "📱", "🛡️", "💰", "🎬", "🎤", "🔬", "🌍", "✨", "🧩", "📈", "🎯"];

export function CourseInfoForm({ categories, initial }: { categories: { id: string; name: string; icon: string }[]; initial?: Initial }) {
  const [state, action, pending] = useActionState(initial ? updateCourseInfo.bind(null, initial.id) : createCourse, undefined);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "📘");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [price, setPrice] = useState(initial?.price ?? 0);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.ok) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <input type="hidden" name="emoji" value={emoji} />
      <input type="hidden" name="color" value={color} />
      <div className="card space-y-5 p-6 sm:p-8">
        <Field label="Titre du cours">
          <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. JavaScript moderne de zéro" required />
        </Field>
        <Field label="Sous-titre" hint="Une phrase qui donne envie : la promesse du cours.">
          <Input name="subtitle" defaultValue={initial?.subtitle} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Catégorie">
            <Select name="categoryId" defaultValue={initial?.categoryId ?? ""} required>
              <option value="" disabled>Choisir…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Niveau">
            <Select name="level" defaultValue={initial?.level ?? "BEGINNER"}>
              <option value="BEGINNER">🌱 Débutant</option>
              <option value="INTERMEDIATE">🌿 Intermédiaire</option>
              <option value="ADVANCED">🌳 Avancé</option>
            </Select>
          </Field>
          <Field label="Prix (FCFA)" hint={price > 0 ? `≈ ${formatPrice(price, "EUR")} · ${formatPrice(price, "USD")}` : "0 = cours gratuit"}>
            <Input name="price" type="number" min={0} step={500} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-2xl border-2 border-line p-3.5">
            <input type="checkbox" name="certified" defaultChecked={initial?.certified ?? true} className="h-5 w-5 accent-[var(--brand)]" />
            <span>
              <span className="block text-sm font-extrabold">🎓 Cours certifiant</span>
              <span className="text-xs text-muted">Examen final requis</span>
            </span>
          </label>
        </div>
        <Field label="Description">
          <Textarea name="description" defaultValue={initial?.description} rows={6} placeholder="Présente ton cours, à qui il s'adresse et ce qu'on y fait." />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Ce que l'on va apprendre" hint="Un objectif par ligne">
            <Textarea name="outcomes" defaultValue={initial?.outcomes.join("\n")} rows={5} />
          </Field>
          <Field label="Prérequis" hint="Un prérequis par ligne">
            <Textarea name="requirements" defaultValue={initial?.requirements.join("\n")} rows={5} />
          </Field>
        </div>
        <Button type="submit" size="lg" loading={pending}>{initial ? "Enregistrer" : "Créer le cours et ajouter le programme →"}</Button>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden p-2.5">
          <CourseCover course={{ slug: initial?.slug ?? title, emoji, color, title }} className="aspect-[16/10] rounded-[1.25rem]" />
          <p className="p-3 font-display font-extrabold leading-snug">{title || "Titre du cours"}</p>
        </div>
        <div className="card p-5">
          <p className="mb-3 text-sm font-extrabold">Emoji de couverture</p>
          <div className="grid grid-cols-5 gap-1.5">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className={cn("grid aspect-square place-items-center rounded-xl text-xl transition hover:scale-110", emoji === e ? "bg-brand-soft ring-2 ring-brand" : "bg-surface-2")}>
                {e}
              </button>
            ))}
          </div>
          <p className="mb-3 mt-5 text-sm font-extrabold">Couleur</p>
          <div className="flex flex-wrap gap-2">
            {PALETTE_KEYS.map((k) => (
              <button key={k} type="button" onClick={() => setColor(k)} className={cn("h-9 w-9 rounded-full transition hover:scale-110", color === k && "ring-4 ring-brand/40 ring-offset-2 ring-offset-surface")} style={{ background: gradient(k) }} aria-label={k} />
            ))}
          </div>
        </div>
      </aside>
    </form>
  );
}
