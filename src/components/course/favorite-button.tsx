"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/app/actions/courses";
import { cn } from "@/lib/utils";

export function FavoriteButton({ courseId, initial, className }: { courseId: string; initial: boolean; className?: string }) {
  const [fav, setFav] = useOptimistic(initial);
  const [, start] = useTransition();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        start(async () => {
          setFav(!fav);
          const res = await toggleFavorite(courseId);
          if (res?.error) toast.error(res.error);
          else toast(res.favorite ? "Ajoutée à vos favoris" : "Retirée de vos favoris");
        });
      }}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm transition hover:scale-110 active:scale-90",
        className,
      )}
      aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={fav}
    >
      <Heart className={cn("h-[18px] w-[18px] transition", fav ? "fill-pink text-pink animate-pop" : "text-[#16161a]")} />
    </button>
  );
}
