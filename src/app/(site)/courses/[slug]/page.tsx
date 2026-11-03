import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Check, ChevronRight, Clock, Globe, GraduationCap, Infinity as InfinityIcon, ListChecks, PlayCircle, Smartphone, Star, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { formatPrice } from "@/lib/currency";
import { palette } from "@/lib/colors";
import { formatDate, formatDuration, formatNumber, LEVEL_LABEL, timeAgo } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";
import { CourseCover } from "@/components/course/course-cover";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { Curriculum } from "@/components/course/curriculum";
import { StudyPlanner } from "@/components/course/study-planner";
import { EnrollButton } from "@/components/course/enroll-button";
import { FavoriteButton } from "@/components/course/favorite-button";
import { ReviewForm } from "@/components/course/review-form";

type Props = { params: Promise<{ slug: string }> };

async function getCourse(slug: string) {
  return db.course.findUnique({
    where: { slug },
    include: {
      instructor: { include: { _count: { select: { coursesTaught: { where: { status: "PUBLISHED" } } } } } },
      category: true,
      chapters: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, type: true, durationMinutes: true, isPreview: true, videoUrl: true } } } },
      quizzes: { where: { isFinal: true }, select: { id: true, _count: { select: { questions: true } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course ? { title: course.title, description: course.subtitle } : {};
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const [course, user, currency] = await Promise.all([getCourse(slug), getCurrentUser(), getCurrency()]);
  if (!course) notFound();
  const isOwner = user && (user.id === course.instructorId || user.role === "ADMIN");
  if (course.status !== "PUBLISHED" && !isOwner) notFound();

  const [enrollment, favorite, reviews, ratingGroups, myReview, similar, instructorStats] = await Promise.all([
    user ? db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    user ? db.favorite.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    db.review.findMany({ where: { courseId: course.id }, orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    db.review.groupBy({ by: ["rating"], where: { courseId: course.id }, _count: true }),
    user ? db.review.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } }) : null,
    db.course.findMany({ where: { status: "PUBLISHED", categoryId: course.categoryId, id: { not: course.id } }, orderBy: { studentsCount: "desc" }, take: 3, select: courseCardSelect }),
    db.course.aggregate({ where: { instructorId: course.instructorId, status: "PUBLISHED" }, _sum: { studentsCount: true }, _avg: { ratingAvg: true } }),
  ]);

  const p = palette(course.color);
  const lessons = course.chapters.flatMap((c) => c.lessons);
  const videoMinutes = lessons.filter((l) => l.type === "VIDEO").reduce((s, l) => s + l.durationMinutes, 0);
  const quizCount = lessons.filter((l) => l.type === "QUIZ").length;
  const hasFinal = course.quizzes.length > 0;
  const priceLabel = formatPrice(course.price, currency);

  const includes = [
    { icon: PlayCircle, text: `${formatDuration(videoMinutes)} de vidéo` },
    { icon: ListChecks, text: `${lessons.length} leçons · ${quizCount} quiz` },
    ...(course.certified ? [{ icon: GraduationCap, text: "Certificat vérifiable" }] : []),
    { icon: InfinityIcon, text: "Accès illimité, à ton rythme" },
    { icon: Smartphone, text: "Sur mobile, tablette et ordinateur" },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(120deg, #16122b 0%, #16122b 45%, ${p.ink} 100%)` }}>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-40 blur-3xl" style={{ background: p.from }} />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full opacity-25 blur-3xl" style={{ background: p.to }} />
        <Container className="relative grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
          <div className="max-w-3xl">
            <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm font-semibold text-white/60">
              <Link href="/courses" className="hover:text-white">Catalogue</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/courses?category=${course.category.slug}`} className="hover:text-white">
                {course.category.name}
              </Link>
            </nav>
            <div className="mb-4 flex flex-wrap gap-2">
              {course.featured && <Pill solid color="sun">⭐ Coup de cœur</Pill>}
              {course.certified && <Pill solid color="violet">🎓 Certifiant</Pill>}
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold">{LEVEL_LABEL[course.level]}</span>
              {course.status !== "PUBLISHED" && <Pill solid color="coral">Aperçu · {course.status}</Pill>}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-4 text-lg text-white/75 sm:text-xl">{course.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold">
              {course.ratingCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sun">{course.ratingAvg.toFixed(1)}</span>
                  <Stars value={course.ratingAvg} />
                  <span className="text-white/60">({formatNumber(course.ratingCount)} avis)</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-white/80">
                <Users className="h-4 w-4" /> {formatNumber(course.studentsCount)} apprenants
              </span>
              <span className="flex items-center gap-1.5 text-white/80">
                <Clock className="h-4 w-4" /> {formatDuration(course.durationMinutes)} au total
              </span>
              <span className="flex items-center gap-1.5 text-white/80">
                <Globe className="h-4 w-4" /> {course.language}
              </span>
            </div>
            <Link href={`/u/${course.instructor.username}`} className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 py-2 pl-2 pr-4 transition hover:bg-white/15">
              <Avatar user={course.instructor} size={40} />
              <span className="text-sm">
                <span className="block text-white/60">Formateur</span>
                <span className="flex items-center gap-1 font-extrabold">
                  {course.instructor.name}
                  {course.instructor.instructorVerified && <BadgeCheck className="h-4 w-4 text-sky" />}
                </span>
              </span>
            </Link>
          </div>
        </Container>
      </section>

      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_380px]">
        {/* COLONNE PRINCIPALE */}
        <div className="min-w-0 space-y-12 lg:order-1">
          <section className="card p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-extrabold">Ce que tu vas apprendre</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-ink-soft">{o}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-2xl font-extrabold">Programme du cours</h2>
              <p className="text-sm font-semibold text-muted">
                {course.chapters.length} chapitres · {lessons.length} leçons · {formatDuration(course.durationMinutes)}
                {hasFinal && " · examen final"}
              </p>
            </div>
            <Curriculum
              chapters={course.chapters.map((c) => ({ id: c.id, title: c.title, summary: c.summary, lessons: c.lessons }))}
              finalExam={hasFinal ? course.quizzes[0]._count.questions : null}
            />
          </section>

          <StudyPlanner totalMinutes={course.durationMinutes} defaultMinutes={user?.dailyGoalMinutes ?? 15} />

          <section>
            <h2 className="mb-4 text-2xl font-extrabold">Prérequis</h2>
            <ul className="space-y-2">
              {course.requirements.map((r) => (
                <li key={r} className="flex items-center gap-3 text-ink-soft">
                  <span className="h-2 w-2 rounded-full bg-brand" /> {r}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-extrabold">Description</h2>
            <div className="space-y-4 text-[1.05rem] leading-relaxed text-ink-soft">
              {course.description.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="mb-5 text-2xl font-extrabold">Ton formateur</h2>
            <div className="flex flex-col gap-5 sm:flex-row">
              <Avatar user={course.instructor} size={96} />
              <div>
                <Link href={`/u/${course.instructor.username}`} className="flex items-center gap-1.5 text-xl font-extrabold hover:text-brand">
                  {course.instructor.name}
                  {course.instructor.instructorVerified && <BadgeCheck className="h-5 w-5 text-sky" />}
                </Link>
                <p className="font-semibold text-muted">{course.instructor.headline}</p>
                {course.instructor.instructorVerified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-sky/15 px-2.5 py-1 text-xs font-extrabold text-sky">
                    <BadgeCheck className="h-3.5 w-3.5" /> Formateur certifié Learn
                  </span>
                )}
                <div className="mt-4 flex flex-wrap gap-5 text-sm font-semibold text-muted">
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-sun text-sun" /> {(instructorStats._avg.ratingAvg ?? 0).toFixed(1)} de moyenne
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {formatNumber(instructorStats._sum.studentsCount ?? 0)} apprenants
                  </span>
                  <span className="flex items-center gap-1.5">
                    <PlayCircle className="h-4 w-4" /> {course.instructor._count.coursesTaught} cours
                  </span>
                </div>
                {course.instructor.bio && <p className="mt-4 leading-relaxed text-ink-soft">{course.instructor.bio}</p>}
              </div>
            </div>
          </section>

          <section id="avis">
            <h2 className="mb-5 text-2xl font-extrabold">Avis des apprenants</h2>
            {course.ratingCount > 0 ? (
              <div className="card mb-6 grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:p-8">
                <div className="text-center">
                  <p className="font-display text-6xl font-extrabold text-sun">{course.ratingAvg.toFixed(1)}</p>
                  <Stars value={course.ratingAvg} size={18} className="mt-1" />
                  <p className="mt-1 text-sm font-semibold text-muted">{formatNumber(course.ratingCount)} avis</p>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const count = ratingGroups.find((g) => g.rating === n)?._count ?? 0;
                    return (
                      <div key={n} className="flex items-center gap-3 text-sm font-semibold">
                        <span className="w-8 shrink-0 whitespace-nowrap text-muted">{n} ★</span>
                        <ProgressBar value={(count / course.ratingCount) * 100} color="var(--color-sun)" height={10} />
                        <span className="w-12 shrink-0 whitespace-nowrap text-right text-muted">{Math.round((count / course.ratingCount) * 100)} %</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mb-6 text-muted">Pas encore d'avis. Sois le premier à partager ton expérience !</p>
            )}
            {enrollment && <ReviewForm courseId={course.id} initial={myReview ? { rating: myReview.rating, comment: myReview.comment } : null} />}
            <div className="mt-6 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="flex gap-4 border-b border-line pb-4 last:border-0">
                  <Avatar user={r.user} size={44} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-extrabold">{r.user.name}</p>
                      <Stars value={r.rating} size={13} />
                      <span className="text-xs font-semibold text-muted">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 leading-relaxed text-ink-soft">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CARTE D'ACHAT */}
        <aside className="order-first lg:order-2 lg:-mt-72">
          <div className="card sticky top-24 overflow-hidden p-2.5">
            <div className="relative">
              <CourseCover course={course} size="lg" className="aspect-video rounded-[1.25rem]" />
              {user && (
                <div className="absolute right-3 top-3">
                  <FavoriteButton courseId={course.id} initial={!!favorite} />
                </div>
              )}
            </div>
            <div className="p-4 sm:p-5">
              {enrollment ? (
                <>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-muted">Ta progression</span>
                    <span className="text-brand">{enrollment.progress} %</span>
                  </div>
                  <ProgressBar value={enrollment.progress} />
                  <Link href={`/learn/${course.slug}`} className={buttonClass("primary", "lg", "mt-5 w-full")}>
                    {enrollment.progress === 0 ? "Commencer le cours" : enrollment.progress === 100 ? "Revoir le cours" : "Continuer le cours"}
                  </Link>
                  <p className="mt-3 text-center text-xs font-semibold text-muted">Inscrit depuis le {formatDate(enrollment.createdAt)}</p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-3">
                    <span className={`font-display text-4xl font-extrabold ${course.price === 0 ? "text-mint" : ""}`}>{priceLabel}</span>
                    {course.price > 0 && currency !== "XAF" && <span className="text-sm font-semibold text-muted">{formatPrice(course.price, "XAF")}</span>}
                  </div>
                  <EnrollButton courseId={course.id} slug={course.slug} free={course.price === 0} loggedIn={!!user} priceLabel={priceLabel} />
                  {course.price > 0 && <p className="mt-3 text-center text-xs font-semibold text-muted">💳 Carte · Orange Money · MTN MoMo · PayPal</p>}
                </>
              )}
              <div className="mt-6 border-t border-line pt-5">
                <p className="mb-3 text-sm font-extrabold">Ce cours comprend</p>
                <ul className="space-y-2.5">
                  {includes.map((i) => (
                    <li key={i.text} className="flex items-center gap-3 text-sm font-medium text-ink-soft">
                      <i.icon className="h-[18px] w-[18px] text-brand" /> {i.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </Container>

      {similar.length > 0 && (
        <Container className="pb-10">
          <h2 className="mb-6 text-2xl font-extrabold">Les apprenants ont aussi aimé</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((c) => (
              <CourseCard key={c.id} course={c} currency={currency} />
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}
