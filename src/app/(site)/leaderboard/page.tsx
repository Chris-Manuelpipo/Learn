import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { leaderboard, startOfWeek } from "@/lib/stats";
import { leagueFor, levelInfo } from "@/lib/gamification";
import { formatNumber, cn } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Classement" };

const PERIODS = [
  ["week", "Cette semaine"],
  ["month", "Ce mois-ci"],
  ["all", "Depuis le début"],
] as const;

const PODIUM = ["#d4a017", "#9aa4b2", "#b87333"];

const LEAGUES = [
  ["Bronze", "0 à 119 XP", "#b87333"],
  ["Argent", "120 à 299 XP", "#9aa4b2"],
  ["Or", "300 à 599 XP", "#d4a017"],
  ["Diamant", "600 XP et plus", "#38bdf8"],
] as const;

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { period = "week" } = await searchParams;
  const user = await getCurrentUser();
  const since = period === "all" ? null : period === "month" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : startOfWeek();
  const rows = await leaderboard(since, 50);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myIndex = user ? rows.findIndex((r) => r.user.id === user.id) : -1;

  return (
    <Container className="max-w-4xl py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classement</h1>
          <p className="mt-1 text-muted">Les apprenants les plus actifs, selon l'XP gagnée sur la période.</p>
        </div>
        <div className="inline-flex rounded-xl bg-surface-2 p-1">
          {PERIODS.map(([k, l]) => (
            <Link key={k} href={`/leaderboard?period=${k}`} className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition", period === k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
              {l}
            </Link>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podium.map((r, i) => (
          <Link key={r.user.id} href={`/u/${r.user.username}`} className={cn("card flex items-center gap-4 p-5 transition hover:border-line-strong sm:flex-col sm:text-center", i === 0 && "sm:order-2", i === 1 && "sm:order-1", i === 2 && "sm:order-3")}>
            <div className="relative">
              <Avatar user={r.user} size={i === 0 ? 72 : 60} />
              <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white ring-2 ring-surface" style={{ background: PODIUM[i] }}>
                {i + 1}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.user.name}</p>
              <p className="text-sm font-semibold text-brand-ink">{formatNumber(r.xp)} XP</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        {rest.map((r, i) => {
          const me = r.user.id === user?.id;
          const lv = levelInfo(r.user.xp);
          const league = since ? leagueFor(r.xp) : null;
          return (
            <Link
              key={r.user.id}
              href={`/u/${r.user.username}`}
              className={cn("flex items-center gap-3 border-b border-line px-4 py-3 transition last:border-0 hover:bg-surface-2 sm:gap-4 sm:px-6", me && "bg-brand-soft hover:bg-brand-soft")}
            >
              <span className="w-7 text-center text-sm font-semibold text-muted">{i + 4}</span>
              <Avatar user={r.user} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {r.user.name} {me && <span className="font-normal text-muted">(vous)</span>}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  Niveau {lv.level} · {lv.title}
                  {r.user.streak > 0 && (
                    <>
                      <span>·</span>
                      <Flame className="h-3 w-3 text-coral" /> {r.user.streak}
                    </>
                  )}
                </p>
              </div>
              {league && <Trophy className="hidden h-4 w-4 sm:block" style={{ color: league.tone }} aria-label={`Ligue ${league.name}`} />}
              <span className="text-sm font-semibold">{formatNumber(r.xp)} XP</span>
            </Link>
          );
        })}
      </div>

      {user && myIndex === -1 && (
        <div className="sticky bottom-4 mt-6 flex items-center gap-4 rounded-2xl p-4 text-white shadow-xl" style={{ background: "var(--night)" }}>
          <Avatar user={user} size={40} />
          <p className="flex-1 text-sm text-white/85">Vous n'êtes pas encore dans les 50 premiers sur cette période. Une leçon rapporte 10 XP, un quiz réussi 25 XP.</p>
          <Link href="/my-courses" className={buttonClass("primary", "sm")}>
            Continuer
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {LEAGUES.map(([n, r, tone]) => (
          <div key={n} className="card flex items-center gap-3 p-4">
            <Trophy className="h-5 w-5 shrink-0" style={{ color: tone }} />
            <div>
              <p className="text-sm font-semibold">Ligue {n}</p>
              <p className="text-xs text-muted">{r} par semaine</p>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
