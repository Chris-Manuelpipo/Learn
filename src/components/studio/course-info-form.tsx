"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GraduationCap, ImageUp } from "lucide-react";
import { createCourse, updateCourseInfo } from "@/app/actions/studio";
import { CourseCover } from "@/components/course/course-cover";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PALETTE_KEYS, palette } from "@/lib/colors";
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
  coverUrl: string | null;
  color: string;
  certified: boolean;
  outcomes: string[];
  requirements: string[];
  slug: string;
};

export function CourseInfoForm({ categories, initial }: { categories: { id: string; name: string }[]; initial?: Initial }) {
  const [state, action, pending] = useActionState(initial ? updateCourseInfo.bind(null, initial.id) : createCourse, undefined);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [color, setColor] = useState(initial?.color ?? "violet");
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.ok) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="color" value={color} />
      <div className="card space-y-5 p-6 sm:p-8">
        <Field label="Titre de la formation">
          <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. JavaScript moderne de zéro" required />
        </Field>
        <Field label="Sous-titre" hint="Une phrase qui résume la promesse de la formation.">
          <Input name="subtitle" defaultValue={initial?.subtitle} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Catégorie">
            <Select name="categoryId" defaultValue={initial?.categoryId ?? ""} required>
              <option value="" disabled>
                Choisir…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Niveau">
            <Select name="level" defaultValue={initial?.level ?? "BEGINNER"}>
              <option value="BEGINNER">Débutant</option>
              <option value="INTERMEDIATE">Intermédiaire</option>
              <option value="ADVANCED">Avancé</option>
            </Select>
          </Field>
          <Field label="Prix (FCFA)" hint={price > 0 ? `Soit environ ${formatPrice(price, "EUR")} · ${formatPrice(price, "USD")}` : "0 pour une formation gratuite"}>
            <Input name="price" type="number" min={0} step={500} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-line p-3.5">
            <input type="checkbox" name="certified" defaultChecked={initial?.certified ?? true} className="h-5 w-5 accent-[var(--brand)]" />
            <GraduationCap className="h-5 w-5 text-brand" />
            <span>
              <span className="block text-sm font-semibold">Formation certifiante</span>
              <span className="text-xs text-muted">Examen final requis</span>
            </span>
          </label>
        </div>
        <Field label="Description">
          <Textarea name="description" defaultValue={initial?.description} rows={6} placeholder="Présentez la formation, son public et son contenu." />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Objectifs pédagogiques" hint="Un objectif par ligne">
            <Textarea name="outcomes" defaultValue={initial?.outcomes.join("\n")} rows={5} />
          </Field>
          <Field label="Prérequis" hint="Un prérequis par ligne">
            <Textarea name="requirements" defaultValue={initial?.requirements.join("\n")} rows={5} />
          </Field>
        </div>
        <Button type="submit" size="lg" loading={pending}>
          {initial ? "Enregistrer" : "Créer la formation et construire le programme"}
        </Button>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden p-2">
          <CourseCover course={{ slug: initial?.slug ?? title, color, title, coverUrl: filePreview ?? (coverUrl || null) }} className="aspect-[16/10] rounded-[1.1rem]" />
          <p className="p-3 font-bold leading-snug">{title || "Titre de la formation"}</p>
        </div>
        <div className="card space-y-4 p-5">
          <p className="text-sm font-semibold">Image de couverture</p>
          <input
            ref={fileRef}
            type="file"
            name="cover"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFilePreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
            <ImageUp className="h-4 w-4" /> {filePreview ? "Changer l'image" : "Téléverser une image"}
          </Button>
          <Field label="ou adresse d'une image" hint="Lien direct, par exemple une photo Unsplash.">
            <Input name="coverUrl" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://images.unsplash.com/…" className="h-10 text-sm" />
          </Field>
          <div>
            <p className="mb-2 text-xs text-muted">Couleur de repli (si aucune image)</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setColor(k)}
                  className={cn("h-7 w-7 rounded-full transition", color === k && "ring-2 ring-brand ring-offset-2 ring-offset-surface")}
                  style={{ background: `linear-gradient(135deg, ${palette(k).from}, ${palette(k).to})` }}
                  aria-label={k}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
