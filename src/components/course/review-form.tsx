"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { submitReview } from "@/app/actions/courses";
import { useCelebrate } from "@/components/gamification/celebration";
import { cn } from "@/lib/utils";

const LABELS = ["", "Décevant", "Bof", "Correct", "Très bien", "Génial !"];

export function ReviewForm({ courseId, initial }: { courseId: string; initial: { rating: number; comment: string } | null }) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [pending, start] = useTransition();
  const celebrate = useCelebrate();
  const shown = hover || rating;

  return (
    <form
      className="card p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await submitReview(courseId, rating, comment);
          if (res.error) return void toast.error(res.error);
          toast.success(initial ? "Avis mis à jour" : "Merci pour ton avis !");
          celebrate(res.reward);
        });
      }}
    >
      <p className="font-extrabold">{initial ? "Modifier ton avis" : "Qu'as-tu pensé de ce cours ?"}</p>
      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="transition hover:scale-125" aria-label={`${n} étoiles`}>
            <Star className={cn("h-8 w-8", n <= shown ? "fill-sun text-sun" : "text-line-strong")} strokeWidth={1.5} />
          </button>
        ))}
        <span className="ml-3 text-sm font-extrabold text-muted">{LABELS[shown]}</span>
      </div>
      <Textarea className="mt-4" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ce qui t'a plu, ce qui pourrait être amélioré…" maxLength={1000} />
      <div className="mt-4 flex items-center justify-between gap-3">
        {!initial && <span className="text-xs font-bold text-muted">⚡ +15 XP pour ton premier avis</span>}
        <Button type="submit" loading={pending} disabled={!rating} className="ml-auto">
          {initial ? "Mettre à jour" : "Publier mon avis"}
        </Button>
      </div>
    </form>
  );
}
