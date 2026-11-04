import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, Compass, Flame, GraduationCap, Lightbulb, Play, Target, Trophy, UserCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { levelInfo, leagueFor } from "@/lib/gamification";
import { dailyActivity, dayKey, leaderboard, startOfWeek, weeklyRank } from "@/lib/stats";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty";
import { BadgeMedal } from "@/components/ui/badge-medal";
import { CourseCover } from "@/components/course/course-cover";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { ActivityHeatmap, WeekBars } from "@/components/dashboard/charts";
import { WelcomeBanner } from "@/components/dashboard/welcome";

export const metadata: Metadata = { title: "Tableau de bord" };

function greeting() {
  const h = new Date().getHours();
  if (h < 5 || h >= 18) return "Bonsoir";
  return "Bonjour";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser("/dashboard");
  const { welcome } = await searchParams;
  const currency = await getCurrency();

  const [enrollments, certificates, badges, badgeOwned, badgeTotal, activity, rank, weekTop] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { lastAccessAt: "desc" },
      include: { course: { select: { ...courseCardSelect, chapters: { orderBy: { position: "asc" }, select: { title: true, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true } } } } } } },
    }),
    db.certificate.findMany({ where: { userId: user.id }, select: { courseId: true, code: true, score: true } }),
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
  const certCount = certificates.length;
  const certByCourse = new Map(certificates.map((c) => [c.courseId, c]));
  const completed = enrollments.filter((e) => e.completedAt).sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
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
      ? "Vous avez atteint votre objectif du jour."
      : user.streak > 0
        ? `Série en cours : ${user.streak} jour${user.streak > 1 ? "s" : ""}. Une leçon aujourd'hui pour la prolonger.`
        : "Suivez une leçon aujourd'hui pour démarrer votre série.";

  return (
    <Container className="py-8 sm:py-10">
      {welcome && <WelcomeBanner name={first} />}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={56} />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              {greeting()} {first}
            </h1>
            <p className="mt-0.5 text-muted">{message}</p>
          </div>
        </div>
        <Link href="/courses" className={buttonClass("secondary", "md")}>
          <BookOpen className="h-4 w-4" /> Explorer les formations
        </Link>
      </div>

      {/* INDICATEURS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Série en cours</p>
            <Flame className={cn("h-5 w-5", user.streak > 0 ? "text-coral" : "text-muted")} />
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {user.streak} <span className="text-base font-medium text-muted">jour{user.streak > 1 ? "s" : ""}</span>
          </p>
          <div className="mt-4 flex justify-between gap-1">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "h-7 w-7 rounded-full",
                    d.active ? "bg-coral" : d.today ? "border border-dashed border-coral/50" : "bg-surface-2",
                    d.future && "opacity-50",
                  )}
                />
                <span className={cn("text-[11px] font-medium", d.today ? "text-ink" : "text-muted")}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Niveau</p>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-ink">{level.title}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{level.level}</p>
            <p className="text-sm text-muted">{formatNumber(user.xp)} XP au total</p>
          </div>
          <ProgressBar value={level.percent} className="mt-4" height={8} />
          <p className="mt-2 text-xs text-muted">
            Encore {formatNumber(level.needed - level.current)} XP pour le niveau {level.level + 1}
          </p>
        </div>

        <div className="card flex items-center gap-5 p-5">
          <ProgressRing value={goalPct} size={84} stroke={9} color="var(--brand)">
            <Target className="h-6 w-6 text-brand" />
          </ProgressRing>
          <div>
            <p className="text-sm font-medium text-muted">Objectif du jour</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {today.minutes}
              <span className="text-base font-medium text-muted"> / {user.dailyGoalMinutes} min</span>
            </p>
            <Link href="/profile#objectif" className="text-xs font-semibold text-brand-ink hover:underline">
              Modifier l'objectif
            </Link>
          </div>
        </div>

        <div className="card grid grid-cols-2 divide-x divide-line p-0">
          <Link href="/certificates" className="p-5 transition hover:bg-surface-2">
            <GraduationCap className="h-5 w-5 text-brand" />
            <p className="mt-3 text-3xl font-bold tracking-tight">{certCount}</p>
            <p className="text-sm text-muted">certificat{certCount > 1 ? "s" : ""}</p>
          </Link>
          <Link href="/badges" className="p-5 transition hover:bg-surface-2">
            <Award className="h-5 w-5 text-brand" />
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {badgeOwned}
              <span className="text-base font-medium text-muted">/{badgeTotal}</span>
            </p>
            <p className="text-sm text-muted">badges</p>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-8">
          {/* REPRENDRE */}
          {current ? (
            <section className="card group overflow-hidden p-3 sm:p-4">
              <div className="grid gap-5 sm:grid-cols-[260px_1fr]">
                <Link href={`/learn/${current.course.slug}`} className="relative block overflow-hidden rounded-[1.1rem]">
                  <CourseCover course={current.course} className="aspect-video sm:aspect-auto sm:h-full sm:min-h-44" />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25">
                    <span className="grid h-14 w-14 scale-90 place-items-center rounded-full bg-white text-[#16191c] opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
                      <Play className="ml-0.5 h-6 w-6 fill-current" />
                    </span>
                  </span>
                </Link>
                <div className="flex flex-col p-2 sm:py-3 sm:pr-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-ink">{current.progress === 0 ? "Prête à commencer" : "Reprendre la formation"}</p>
                  <h2 className="mt-1 text-xl font-bold leading-tight">{current.course.title}</h2>
                  {nextLesson && (
                    <p className="mt-2 text-sm text-muted">
                      {nextLesson.chapter}
                      {nextLesson.title !== nextLesson.chapter && (
                        <>
                          {" · "}
                          <span className="text-ink-soft">{nextLesson.title}</span>
                        </>
                      )}
                    </p>
                  )}
                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted">Progression</span>
                      <span className="font-semibold">{current.progress} %</span>
                    </div>
                    <ProgressBar value={current.progress} height={8} />
                    <Link href={`/learn/${current.course.slug}`} className={buttonClass("primary", "md", "mt-5 w-full sm:w-auto")}>
                      <Play className="h-4 w-4 fill-current" /> {current.progress === 0 ? "Commencer" : "Continuer"}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <EmptyState
              icon={Compass}
              title="Votre parcours commence ici"
              text="Choisissez une première formation. La plupart des apprenants commencent par une formation gratuite."
              action={
                <Link href="/courses?price=free" className={buttonClass("primary", "lg")}>
                  Voir les formations gratuites
                </Link>
              }
            />
          )}

          {/* EN COURS */}
          {inProgress.length > 1 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Vos formations en cours</h2>
                <Link href="/my-courses" className="text-sm font-semibold text-brand-ink hover:underline">
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

          {/* TERMINÉES */}
          {completed.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Formations terminées <span className="text-base font-medium text-muted">· {completed.length}</span>
                </h2>
                <Link href="/my-courses?tab=done" className="text-sm font-semibold text-brand-ink hover:underline">
                  Tout voir
                </Link>
              </div>
              <div className="card divide-y divide-line">
                {completed.slice(0, 4).map((e) => {
                  const cert = certByCourse.get(e.courseId);
                  return (
                    <div key={e.id} className="flex items-center gap-4 p-4">
                      <CourseCover course={e.course} size="sm" className="h-14 w-20 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/courses/${e.course.slug}`} className="block truncate font-semibold hover:text-brand-ink">
                          {e.course.title}
                        </Link>
                        <p className="text-sm text-muted">
                          Terminée le {formatDate(e.completedAt!, { day: "numeric", month: "long", year: "numeric" })}
                          {cert ? ` · examen réussi à ${cert.score} %` : " · formation non certifiante"}
                        </p>
                      </div>
                      {cert ? (
                        <Link href={`/certificates/${cert.code}`} className={buttonClass("secondary", "sm", "shrink-0")}>
                          <GraduationCap className="h-4 w-4" /> <span className="hidden sm:inline">Certificat</span>
                        </Link>
                      ) : (
                        <Link href={`/learn/${e.course.slug}`} className={buttonClass("ghost", "sm", "shrink-0")}>
                          Revoir
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ACTIVITÉ */}
          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Votre activité</h2>
                <p className="text-sm text-muted">12 dernières semaines · meilleure série : {user.bestStreak} jours</p>
              </div>
              <p className="text-sm text-muted">
                <span className="text-xl font-bold text-ink">{formatNumber(activity.reduce((s, a) => s + a.minutes, 0))}</span> minutes d'apprentissage
              </p>
            </div>
            <ActivityHeatmap days={activity} />
            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-3 text-sm font-medium text-muted">XP des 7 derniers jours</p>
              <WeekBars days={activity.slice(-7)} />
            </div>
          </section>

          {/* RECOMMANDÉS */}
          <section>
            <h2 className="mb-4 text-xl font-bold">Recommandé pour vous</h2>
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
            <div className="flex items-center justify-between p-5" style={{ background: "var(--night)" }}>
              <div className="text-white">
                <p className="font-bold">Ligue {league.name}</p>
                <p className="mt-0.5 text-sm text-white/65">
                  {rank.rank ? `Vous êtes ${rank.rank}e cette semaine avec ${rank.xp} XP` : "Gagnez de l'XP pour entrer dans le classement"}
                </p>
              </div>
              <Trophy className="h-7 w-7" style={{ color: league.tone }} />
            </div>
            <ol className="space-y-0.5 p-3">
              {weekTop.map((r, i) => (
                <li key={r.user.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2", r.user.id === user.id && "bg-brand-soft")}>
                  <span className="w-5 text-center text-sm font-semibold text-muted">{i + 1}</span>
                  <Avatar user={r.user} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.user.id === user.id ? "Vous" : r.user.name}</span>
                  <span className="text-sm font-semibold text-ink-soft">{r.xp} XP</span>
                </li>
              ))}
            </ol>
            <Link href="/leaderboard" className="flex items-center justify-center gap-1.5 border-t border-line py-3.5 text-sm font-semibold text-brand-ink hover:bg-surface-2">
              Classement complet <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Derniers badges</h2>
              <Link href="/badges" className="text-sm font-semibold text-brand-ink hover:underline">
                Tous
              </Link>
            </div>
            {badges.length ? (
              <div className="grid grid-cols-3 gap-3">
                {badges.map(({ badge }) => (
                  <div key={badge.id} className="flex flex-col items-center gap-2 text-center" title={badge.description}>
                    <BadgeMedal icon={badge.icon} color={badge.color} size={48} />
                    <span className="text-[11px] font-medium leading-tight text-ink-soft">{badge.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Terminez votre première leçon pour obtenir votre premier badge.</p>
            )}
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
              <Lightbulb className="h-4 w-4" /> Conseil d'apprentissage
            </div>
            <p className="mt-2 leading-relaxed text-ink-soft">
              Avant de lancer une nouvelle leçon, essayez de vous rappeler trois points de la précédente. Ce rappel actif est l'une des méthodes de mémorisation les plus efficaces.
            </p>
          </section>

          {user.role === "STUDENT" && (
            <Link href="/become-instructor" className="card flex items-center gap-4 p-5 transition hover:border-line-strong">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                <UserCheck className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Partagez votre expertise</span>
                <span className="text-sm text-muted">Devenez formateur certifié</span>
              </span>
              <ArrowRight className="h-5 w-5 text-muted" />
            </Link>
          )}
        </aside>
      </div>
    </Container>
  );
}
