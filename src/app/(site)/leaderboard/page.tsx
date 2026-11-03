import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { leaderboard, startOfWeek } from "@/lib/stats";
import { leagueFor, levelInfo } from "@/lib/gamification";
import { formatNumber, cn } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";

export const metadata: Metadata = { title: "Classement" };

const PERIODS = [
  ["week", "Cette semaine"],
  ["month", "Ce mois-ci"],
  ["all", "Tous les temps"],
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
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#16122b] to-[#2d1f6b] pb-32 pt-12 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,194,61,.25),transparent_50%)]" />
        <Container className="relative text-center">
          <p className="text-5xl">🏆</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Classement</h1>
          <p className="mt-2 text-white/70">Gagne de l'XP en apprenant et grimpe parmi les meilleurs apprenants.</p>
          <div className="mx-auto mt-6 inline-flex rounded-2xl bg-white/10 p-1.5">
            {PERIODS.map(([k, l]) => (
              <Link key={k} href={`/leaderboard?period=${k}`} className={cn("rounded-xl px-4 py-2 text-sm font-extrabold transition", period === k ? "bg-white text-[#16122b]" : "text-white/75 hover:text-white")}>
                {l}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Container className="-mt-24 max-w-4xl">
        <div className="grid grid-cols-3 items-end gap-3 sm:gap-6">
          {[1, 0, 2].map((i) => {
            const r = podium[i];
            if (!r) return <div key={i} />;
            const h = ["h-40 sm:h-48", "h-28 sm:h-36", "h-20 sm:h-28"][i];
            const color = ["from-[#ffc93d] to-[#ff9f1c]", "from-[#d9dbe8] to-[#a9adc4]", "from-[#ffb08a] to-[#e07a4f]"][i];
            return (
              <Link href={`/u/${r.user.username}`} key={r.user.id} className="group flex flex-col items-center">
                <div className="relative">
                  {i === 0 && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl">👑</span>}
                  <Avatar user={r.user} size={i === 0 ? 88 : 68} ring className="shadow-xl transition group-hover:scale-105" />
                </div>
                <p className="mt-3 max-w-full truncate text-center text-sm font-extrabold sm:text-base">{r.user.name}</p>
                <p className="text-sm font-extrabold text-brand">{formatNumber(r.xp)} XP</p>
                <div className={cn("mt-3 grid w-full place-items-center rounded-t-3xl bg-gradient-to-b font-display text-4xl font-extrabold text-white shadow-inner", h, color)}>{i + 1}</div>
              </Link>
            );
          })}
        </div>

        <div className="card mt-0 overflow-hidden rounded-t-none">
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
                <span className="w-8 text-center font-display text-lg font-extrabold text-muted">{i + 4}</span>
                <Avatar user={r.user} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">
                    {r.user.name} {me && <span className="text-brand">(toi)</span>}
                  </p>
                  <p className="text-xs font-semibold text-muted">
                    Niv. {lv.level} · {lv.title} {r.user.streak > 0 && `· 🔥 ${r.user.streak}`}
                  </p>
                </div>
                {league && <span className="hidden text-xl sm:block" title={`Ligue ${league.name}`}>{league.emoji}</span>}
                <span className="font-display font-extrabold text-brand">{formatNumber(r.xp)} XP</span>
              </Link>
            );
          })}
        </div>

        {user && myIndex === -1 && (
          <div className="sticky bottom-4 mt-6 flex items-center gap-4 rounded-3xl bg-[#16122b] p-4 text-white shadow-2xl">
            <Avatar user={user} size={44} />
            <p className="flex-1 text-sm font-bold">Tu n'es pas encore dans le top 50 sur cette période. Une leçon = 10 XP, un quiz = 25 XP. À toi de jouer !</p>
            <Link href="/my-courses" className="rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-[#4a2f00]">
              Apprendre
            </Link>
          </div>
        )}
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {[
            ["🥉", "Bronze", "0 – 119 XP"],
            ["🥈", "Argent", "120 – 299 XP"],
            ["🥇", "Or", "300 – 599 XP"],
            ["💎", "Diamant", "600+ XP"],
          ].map(([e, n, r]) => (
            <div key={n} className="card flex items-center gap-3 p-4">
              <span className="text-3xl">{e}</span>
              <div>
                <p className="font-extrabold">Ligue {n}</p>
                <p className="text-xs font-semibold text-muted">{r} / semaine</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
