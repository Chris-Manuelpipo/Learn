"use client";

import { createContext, useCallback, useContext } from "react";
import { toast } from "sonner";
import { Award, TrendingUp, Zap } from "lucide-react";
import type { Reward } from "@/lib/progression";

type Ctx = { celebrate: (reward: Reward | null | undefined) => void };
const CelebrationContext = createContext<Ctx>({ celebrate: () => {} });
export const useCelebrate = () => useContext(CelebrationContext).celebrate;

/** Retour de progression discret : XP, niveau et badges s'affichent en notifications sobres. */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const celebrate = useCallback((reward: Reward | null | undefined) => {
    if (!reward) return;
    if (reward.xp > 0) {
      toast(`+${reward.xp} XP`, {
        icon: <Zap className="h-4 w-4 text-brand" />,
        description: reward.streak > 1 ? `Série de ${reward.streak} jours` : undefined,
        duration: 2200,
      });
    }
    if (reward.levelUp) {
      toast.success(`Niveau ${reward.levelUp} atteint`, { icon: <TrendingUp className="h-4 w-4 text-brand" />, duration: 3500 });
    }
    for (const b of reward.badges) {
      toast(`Badge obtenu : ${b.name}`, { icon: <Award className="h-4 w-4 text-brand" />, description: b.description, duration: 4000 });
    }
  }, []);

  return <CelebrationContext.Provider value={{ celebrate }}>{children}</CelebrationContext.Provider>;
}
