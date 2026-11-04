import type { Metadata } from "next";
import { Award, Flame, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { levelInfo } from "@/lib/gamification";
import { formatDate, formatNumber } from "@/lib/utils";
import { Container, PageHeader } from "@/components/ui/section";
import { ProgressBar } from "@/components/ui/progress";
import { BadgeMedal } from "@/components/ui/badge-medal";

export const metadata: Metadata = { title: "Badges et progression" };

export default async function BadgesPage() {
  const user = await requireUser("/badges");
  const [badges, owned] = await Promise.all([db.badge.findMany({ orderBy: { xpReward: "asc" } }), db.userBadge.findMany({ where: { userId: user.id } })]);
  const earned = new Map(owned.map((o) => [o.badgeId, o.earnedAt]));
  const level = levelInfo(user.xp);

  return (
    <Container className="py-10">
      <PageHeader icon={Award} title="Badges et progression" text={`${earned.size} badge${earned.size > 1 ? "s" : ""} obtenu${earned.size > 1 ? "s" : ""} sur ${badges.length}. Chaque badge rapporte de l'XP supplémentaire.`} />

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="card p-6 md:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Niveau {level.level}</p>
              <p className="text-2xl font-bold">{level.title}</p>
            </div>
            <p className="text-sm text-muted">{formatNumber(user.xp)} XP au total</p>
          </div>
          <ProgressBar value={level.percent} className="mt-5" height={10} />
          <p className="mt-2 text-sm text-muted">
            {formatNumber(level.current)} / {formatNumber(level.needed)} XP · niveau {level.level + 1} à {formatNumber(level.nextAt)} XP
          </p>
        </div>
        <div className="card grid grid-cols-2 divide-x divide-line p-0">
          <div className="p-5">
            <Flame className="h-5 w-5 text-coral" />
            <p className="mt-3 text-3xl font-bold tracking-tight">{user.streak}</p>
            <p className="text-sm text-muted">jours de série</p>
          </div>
          <div className="p-5">
            <Trophy className="h-5 w-5 text-brand" />
            <p className="mt-3 text-3xl font-bold tracking-tight">{user.bestStreak}</p>
            <p className="text-sm text-muted">meilleure série</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((b) => {
          const at = earned.get(b.id);
          return (
            <div key={b.id} className="card flex flex-col items-center p-6 text-center">
              <BadgeMedal icon={b.icon} color={b.color} earned={!!at} size={72} />
              <p className="mt-4 font-bold">{b.name}</p>
              <p className="mt-1 text-sm text-muted">{b.description}</p>
              <p className="mt-auto pt-4 text-xs font-medium">
                {at ? <span className="text-brand-ink">Obtenu le {formatDate(at, { day: "numeric", month: "short" })}</span> : <span className="text-muted">+{b.xpReward} XP</span>}
              </p>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
