import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { levelInfo } from "@/lib/gamification";
import { palette } from "@/lib/colors";
import { formatDate, formatNumber } from "@/lib/utils";
import { Container, PageHeader } from "@/components/ui/section";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Badges & succès" };

export default async function BadgesPage() {
  const user = await requireUser("/badges");
  const [badges, owned] = await Promise.all([db.badge.findMany({ orderBy: { xpReward: "asc" } }), db.userBadge.findMany({ where: { userId: user.id } })]);
  const earned = new Map(owned.map((o) => [o.badgeId, o.earnedAt]));
  const level = levelInfo(user.xp);

  return (
    <Container className="py-10">
      <PageHeader emoji="🏅" title="Badges & succès" text={`${earned.size} badge${earned.size > 1 ? "s" : ""} débloqué${earned.size > 1 ? "s" : ""} sur ${badges.length}. Chaque badge rapporte de l'XP bonus !`} />

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-grad-a to-grad-b p-6 text-white md:col-span-2">
          <div className="absolute -right-6 -top-10 font-display text-[10rem] font-extrabold opacity-10">{level.level}</div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-white/70">Niveau {level.level}</p>
          <p className="font-display text-4xl font-extrabold">{level.title}</p>
          <ProgressBar value={level.percent} className="mt-5" height={14} color="linear-gradient(90deg,#ffc93d,#ff9f1c)" track="rgba(255,255,255,.2)" />
          <p className="mt-2 text-sm font-bold text-white/80">
            {formatNumber(level.current)} / {formatNumber(level.needed)} XP · niveau {level.level + 1} à {formatNumber(level.nextAt)} XP
          </p>
        </div>
        <div className="card grid grid-cols-2 gap-3 p-5">
          <div className="rounded-2xl bg-coral/12 p-4 text-center">
            <p className="text-3xl">🔥</p>
            <p className="font-display text-2xl font-extrabold">{user.streak}</p>
            <p className="text-xs font-bold text-muted">série actuelle</p>
          </div>
          <div className="rounded-2xl bg-sun/15 p-4 text-center">
            <p className="text-3xl">🏆</p>
            <p className="font-display text-2xl font-extrabold">{user.bestStreak}</p>
            <p className="text-xs font-bold text-muted">meilleure série</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {badges.map((b) => {
          const at = earned.get(b.id);
          const p = palette(b.color);
          return (
            <div key={b.id} className={cn("card relative flex flex-col items-center p-6 text-center transition", at ? "hover:-translate-y-1" : "opacity-75")}>
              <div
                className={cn("relative grid h-24 w-24 place-items-center rounded-full text-5xl", !at && "grayscale")}
                style={{ background: at ? `linear-gradient(135deg, ${p.from}, ${p.to})` : "var(--surface-2)", boxShadow: at ? `0 6px 0 ${p.ink}` : "none" }}
              >
                <span className={cn(!at && "opacity-40")}>{b.emoji}</span>
                {!at && <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-surface text-base shadow ring-2 ring-line">🔒</span>}
              </div>
              <p className="mt-5 font-display text-lg font-extrabold">{b.name}</p>
              <p className="mt-1 text-sm text-muted">{b.description}</p>
              <p className="mt-auto pt-4 text-xs font-extrabold">
                {at ? <span className="text-mint">✓ Obtenu le {formatDate(at, { day: "numeric", month: "short" })}</span> : <span className="text-[#b57d00] dark:text-sun">⚡ +{b.xpReward} XP</span>}
              </p>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
