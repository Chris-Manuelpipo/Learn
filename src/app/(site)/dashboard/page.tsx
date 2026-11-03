import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, GraduationCap, Play, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { levelInfo, leagueFor } from "@/lib/gamification";
import { dailyActivity, dayKey, leaderboard, startOfWeek, weeklyRank } from "@/lib/stats";
import { formatNumber } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { CourseCover } from "@/components/course/course-cover";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { ActivityHeatmap, WeekBars } from "@/components/dashboard/charts";
import { WelcomeCelebration } from "@/components/dashboard/welcome";

export const metadata: Metadata = { title: "Tableau de bord" };

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser("/dashboard");
  const { welcome } = await searchParams;
  const currency = await getCurrency();

  const [enrollments, certCount, badges, badgeOwned, badgeTotal, activity, rank, weekTop] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { lastAccessAt: "desc" },
      include: { course: { select: { ...courseCardSelect, chapters: { orderBy: { position: "asc" }, select: { title: true, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true } } } } } } },
    }),
    db.certificate.count({ where: { userId: user.id } }),
    db.userBadge.findMany({ where: { userId: user.id }, include: { badge: true }, orderBy: { earnedAt: "desc" }, take: 6 }),
    db.userBadge.count({ where: { userId: user.id } }),
    db.badge.count(),
    dailyActivity(user.id, 84),
    weeklyRank(user.id),
    leaderboard(startOfWeek(), 5),
  ]);

  const level = levelInfo(user.xp);
  const today = activity[activity.length - 1];
  const goalPct = Math.min(100, Math.round((today.minutes / user.dailyGoalMinutes) * 100));
  const inProgress = enrollments.filter((e) => e.progress < 100);
  const current = inProgress[0] ?? enrollments[0];
  const league = leagueFor(rank.xp);
  const first = user.name.split(" ")[0];

  // Semaine en cours pour la série
  const monday = startOfWeek();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const k = dayKey(d);
    const a = activity.find((x) => x.date === k);
    return { label: ["L", "M", "M", "J", "V", "S", "D"][i], active: !!a && a.xp > 0, today: k === dayKey(new Date()), future: d > new Date() };
  });

  let nextLesson: { title: string; chapter: string } | null = null;
  if (current) {
    const all = current.course.chapters.flatMap((c) => c.lessons.map((l) => ({ ...l, chapter: c.title })));
    const l = all.find((x) => x.id === current.lastLessonId) ?? all[0];
    if (l) nextLesson = { title: l.title, chapter: l.chapter };
  }

  const enrolledIds = enrollments.map((e) => e.courseId);
  const enrolledCats = await db.course.findMany({ where: { id: { in: enrolledIds } }, select: { categoryId: true } });
  const recommended = await db.course.findMany({
    where: { status: "PUBLISHED", id: { notIn: enrolledIds }, ...(enrolledCats.length ? { categoryId: { in: enrolledCats.map((c) => c.categoryId) } } : {}) },
    orderBy: [{ ratingAvg: "desc" }, { studentsCount: "desc" }],
    take: 3,
    select: courseCardSelect,
  });

  const message =
    goalPct >= 100
      ? "Objectif du jour atteint, tu es une machine ! 🎉"
      : user.streak > 0
        ? `Ta série de ${user.streak} jour${user.streak > 1 ? "s" : ""} compte sur toi aujourd'hui 🔥`
        : "Une petite leçon aujourd'hui pour lancer ta série ?";

  return (
    <Container className="py-8 sm:py-10">
      {welcome && <WelcomeCelebration name={first} />}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={64} />
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {greeting()}, {first} 👋
            </h1>
            <p className="mt-1 font-semibold text-muted">{message}</p>
          </div>
        </div>
        <Link href="/courses" className={buttonClass("secondary", "md")}>
          <BookOpen className="h-4 w-4" /> Explorer les cours
        </Link>
      </div>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card relative overflow-hidden p-5">
          <div className="absolute -right-4 -top-4 text-7xl opacity-10">🔥</div>
          <p className="text-sm font-extrabold text-muted">Série en cours</p>
          <p className="mt-1 font-display text-4xl font-extrabold text-coral">
            {user.streak} <span className="text-lg text-muted">jour{user.streak > 1 ? "s" : ""}</span>
          </p>
          <div className="mt-4 flex justify-between gap-1">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm transition ${d.active ? "bg-coral text-white shadow-[0_3px_0_#d6402c]" : d.today ? "border-2 border-dashed border-coral/60" : "bg-surface-2"} ${d.future ? "opacity-50" : ""}`}
                >
                  {d.active ? "🔥" : ""}
                </span>
                <span className={`text-[11px] font-extrabold ${d.today ? "text-coral" : "text-muted"}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-muted">Niveau</p>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-extrabold text-brand">{level.title}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="font-display text-4xl font-extrabold text-brand">{level.level}</p>
            <p className="text-sm font-bold text-muted">{formatNumber(user.xp)} XP au total</p>
          </div>
          <ProgressBar value={level.percent} className="mt-4" height={12} color="linear-gradient(90deg,#7c5cff,#ff5fa2)" />
          <p className="mt-2 text-xs font-bold text-muted">
            Encore {formatNumber(level.needed - level.current)} XP pour le niveau {level.level + 1}
          </p>
        </div>

        <div className="card flex items-center gap-5 p-5">
          <ProgressRing value={goalPct} size={92} stroke={11} color={goalPct >= 100 ? "var(--color-mint)" : "var(--color-sun)"}>
            <span className="text-2xl">{goalPct >= 100 ? "✅" : "🎯"}</span>
          </ProgressRing>
          <div>
            <p className="text-sm font-extrabold text-muted">Objectif du jour</p>
            <p className="mt-1 font-display text-3xl font-extrabold">
              {today.minutes}
              <span className="text-lg text-muted">/{user.dailyGoalMinutes} min</span>
            </p>
            <Link href="/profile#objectif" className="text-xs font-bold text-brand hover:underline">
              Modifier l'objectif
            </Link>
          </div>
        </div>

        <div className="card grid grid-cols-2 gap-3 p-5">
          <Link href="/certificates" className="rounded-2xl bg-sun/15 p-3 transition hover:-translate-y-0.5">
            <GraduationCap className="h-6 w-6 text-[#c98a00] dark:text-sun" />
            <p className="mt-2 font-display text-2xl font-extrabold">{certCount}</p>
            <p className="text-xs font-bold text-muted">certificats</p>
          </Link>
          <Link href="/badges" className="rounded-2xl bg-pink/15 p-3 transition hover:-translate-y-0.5">
            <Award className="h-6 w-6 text-pink" />
            <p className="mt-2 font-display text-2xl font-extrabold">
              {badgeOwned}
              <span className="text-sm text-muted">/{badgeTotal}</span>
            </p>
            <p className="text-xs font-bold text-muted">badges</p>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          {/* REPRENDRE */}
          {current ? (
            <section className="card group relative overflow-hidden p-3 sm:p-4">
              <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
                <Link href={`/learn/${current.course.slug}`} className="relative block overflow-hidden rounded-[1.25rem]">
                  <CourseCover course={current.course} className="aspect-video sm:aspect-auto sm:h-full sm:min-h-44" />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/20">
                    <span className="grid h-16 w-16 scale-90 place-items-center rounded-full bg-white/95 text-brand opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
                      <Play className="ml-1 h-7 w-7 fill-current" />
                    </span>
                  </span>
                </Link>
                <div className="flex flex-col p-2 sm:py-3 sm:pr-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-brand">{current.progress === 0 ? "Prêt à commencer" : "Reprendre où tu t'es arrêté"}</p>
                  <h2 className="mt-1 text-2xl font-extrabold leading-tight">{current.course.title}</h2>
                  {nextLesson && (
                    <p className="mt-2 text-sm font-semibold text-muted">
                      {nextLesson.chapter} · <span className="text-ink-soft">{nextLesson.title}</span>
                    </p>
                  )}
                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex justify-between text-sm font-extrabold">
                      <span className="text-muted">Progression</span>
                      <span className="text-brand">{current.progress} %</span>
                    </div>
                    <ProgressBar value={current.progress} height={12} />
                    <Link href={`/learn/${current.course.slug}`} className={buttonClass("primary", "lg", "mt-5 w-full sm:w-auto")}>
                      <Play className="h-5 w-5 fill-current" /> {current.progress === 0 ? "Commencer" : "Continuer"}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <EmptyState
              emoji="🚀"
              title="Ton aventure commence ici"
              text="Choisis un premier cours : la plupart des apprenants commencent par un cours gratuit."
              action={
                <Link href="/courses?price=free" className={buttonClass("primary", "lg")}>
                  Voir les cours gratuits
                </Link>
              }
            />
          )}

          {/* EN COURS */}
          {inProgress.length > 1 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">Tes cours en cours</h2>
                <Link href="/my-courses" className="text-sm font-extrabold text-brand hover:underline">
                  Tout voir
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.slice(1, 4).map((e) => (
                  <CourseCard key={e.id} course={e.course} currency={currency} progress={e.progress} href={`/learn/${e.course.slug}`} />
                ))}
              </div>
            </section>
          )}

          {/* ACTIVITÉ */}
          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-xl font-extrabold">Ton activité</h2>
                <p className="text-sm font-semibold text-muted">12 dernières semaines · meilleure série : {user.bestStreak} jours</p>
              </div>
              <p className="text-sm font-bold text-muted">
                <span className="font-display text-xl font-extrabold text-ink">{formatNumber(activity.reduce((s, a) => s + a.minutes, 0))}</span> min apprises
              </p>
            </div>
            <ActivityHeatmap days={activity} />
            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-3 text-sm font-extrabold text-muted">XP des 7 derniers jours</p>
              <WeekBars days={activity.slice(-7)} />
            </div>
          </section>

          {/* RECOMMANDÉS */}
          <section>
            <h2 className="mb-4 text-2xl font-extrabold">Recommandés pour toi ✨</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((c) => (
                <CourseCard key={c.id} course={c} currency={currency} />
              ))}
            </div>
          </section>
        </div>

        {/* COLONNE DROITE */}
        <aside className="space-y-6">
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-br from-[#16122b] to-[#3b2a8a] p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-extrabold">Ligue {league.name}</p>
                <span className="text-3xl">{league.emoji}</span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                {rank.rank ? (
                  <>
                    Tu es <span className="font-extrabold text-white">#{rank.rank}</span> cette semaine avec {rank.xp} XP
                  </>
                ) : (
                  "Gagne de l'XP pour entrer dans le classement"
                )}
              </p>
            </div>
            <ol className="space-y-1 p-3">
              {weekTop.map((r, i) => (
                <li key={r.user.id} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${r.user.id === user.id ? "bg-brand-soft" : ""}`}>
                  <span className="w-6 text-center font-display font-extrabold text-muted">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                  <Avatar user={r.user} size={34} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{r.user.id === user.id ? "Toi" : r.user.name}</span>
                  <span className="text-sm font-extrabold text-brand">{r.xp} XP</span>
                </li>
              ))}
            </ol>
            <Link href="/leaderboard" className="flex items-center justify-center gap-1.5 border-t border-line py-3.5 text-sm font-extrabold text-brand hover:bg-surface-2">
              <Trophy className="h-4 w-4" /> Classement complet
            </Link>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Derniers badges</h2>
              <Link href="/badges" className="text-sm font-extrabold text-brand hover:underline">
                Tous
              </Link>
            </div>
            {badges.length ? (
              <div className="grid grid-cols-3 gap-3">
                {badges.map(({ badge }) => (
                  <div key={badge.id} className="flex flex-col items-center gap-1.5 rounded-2xl bg-surface-2 p-3 text-center" title={badge.description}>
                    <span className="text-3xl">{badge.emoji}</span>
                    <span className="text-[11px] font-extrabold leading-tight">{badge.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Termine ta première leçon pour débloquer ton premier badge 👣</p>
            )}
          </section>

          <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#ffc93d] to-[#ff9f1c] p-6 text-[#3d2600]">
            <div className="absolute -bottom-6 -right-4 text-8xl opacity-30">🧠</div>
            <p className="text-xs font-extrabold uppercase tracking-wider opacity-70">Astuce d'apprentissage</p>
            <p className="relative mt-2 font-display text-lg font-extrabold leading-snug">
              Avant de lancer une nouvelle leçon, essaie de te rappeler 3 choses de la précédente. C'est le rappel actif : la meilleure façon de mémoriser.
            </p>
          </section>

          <Link href="/become-instructor" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <span className="text-4xl">🧑‍🏫</span>
            <span className="flex-1">
              <span className="block font-extrabold">Partage ton savoir</span>
              <span className="text-sm text-muted">Deviens formateur certifié</span>
            </span>
            <ArrowRight className="h-5 w-5 text-brand" />
          </Link>
        </aside>
      </div>
    </Container>
  );
}
