import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Brain, CalendarCheck, GraduationCap, Timer, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { Container, SectionTitle } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { IconTile } from "@/components/ui/icon";
import { BadgeMedal } from "@/components/ui/badge-medal";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { coverSrc } from "@/components/course/course-cover";
import { HeroVisual } from "@/components/home/hero-visual";
import { formatNumber } from "@/lib/utils";
import { levelInfo } from "@/lib/gamification";
import { BADGES } from "@/lib/badges";

const METHOD = [
  { icon: Timer, title: "Des leçons courtes", text: "Des vidéos de 5 à 12 minutes : l'attention reste intacte et vous progressez même entre deux rendez-vous.", stat: "8 min en moyenne" },
  { icon: Brain, title: "Le rappel actif", text: "Un quiz à la fin de chaque chapitre : se tester est ce qui ancre le plus durablement les connaissances.", stat: "1 quiz par chapitre" },
  { icon: CalendarCheck, title: "La régularité", text: "Objectif quotidien et série de jours : quelques minutes chaque jour valent mieux qu'une longue session.", stat: "15 min par jour" },
  { icon: GraduationCap, title: "La certification", text: "Un examen final et un certificat vérifiable par QR code, prêt à être ajouté à votre profil LinkedIn.", stat: "Vérifiable en ligne" },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const currency = await getCurrency();
  const [categories, popular, free, stats, reviews, learners, top, heroInstructor] = await Promise.all([
    db.category.findMany({ include: { _count: { select: { courses: { where: { status: "PUBLISHED" } } } } } }),
    db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ studentsCount: "desc" }], take: 8, select: courseCardSelect }),
    db.course.findMany({ where: { status: "PUBLISHED", price: 0 }, orderBy: { ratingAvg: "desc" }, take: 4, select: courseCardSelect }),
    Promise.all([db.course.count({ where: { status: "PUBLISHED" } }), db.user.count(), db.certificate.count(), db.review.aggregate({ _avg: { rating: true } })]),
    db.review.findMany({ where: { rating: 5, user: { avatarUrl: { not: null } } }, take: 6, orderBy: { createdAt: "desc" }, include: { user: true, course: { select: { title: true } } } }),
    db.user.findMany({ where: { role: "STUDENT", avatarUrl: { not: null } }, take: 5, orderBy: { xp: "desc" } }),
    db.user.findMany({ orderBy: { xp: "desc" }, take: 5 }),
    db.user.findFirst({ where: { email: "formateur@learn.dev" }, select: { avatarUrl: true } }),
  ]);
  const [courseCount, userCount, certCount, avg] = stats;
  const rating = avg._avg.rating ?? 0;
  const showcase = ["first-step", "streak-7", "quiz-ace", "certified"].map((slug) => BADGES.find((b) => b.slug === slug)!);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <Link href="/courses?certified=1" className="group mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3.5 text-sm font-medium text-ink-soft shadow-sm transition hover:border-line-strong">
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-ink">Nouveau</span>
              Certificats vérifiables par QR code
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
            <h1 className="text-[2.75rem] font-bold leading-[1.05] sm:text-6xl">
              Apprenez les compétences qui comptent, <span className="text-brand">à votre rythme</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {formatNumber(courseCount)} formations en français, conçues par des experts : vidéos courtes, quiz réguliers et certificats reconnus pour progresser concrètement.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonClass("primary", "lg")}>
                Créer un compte gratuit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/courses" className={buttonClass("secondary", "lg")}>
                Explorer le catalogue
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {learners.map((u) => (
                  <Avatar key={u.id} user={u} size={40} ring />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1.5">
                  <Stars value={rating} />
                  <span className="font-semibold">{rating.toFixed(1)}/5</span>
                </div>
                <p className="text-muted">
                  Plus de <span className="font-semibold text-ink">{formatNumber(userCount)}</span> apprenants nous font confiance
                </p>
              </div>
            </div>
          </div>
          <HeroVisual photo={coverSrc("https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=70&w=1200&h=750", 720)} instructorPhoto={heroInstructor?.avatarUrl ?? null} />
        </Container>
      </section>

      {/* CATÉGORIES */}
      <section className="border-y border-line bg-surface py-5">
        <Container>
          <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/courses?category=${c.slug}`}
                className="group flex shrink-0 items-center gap-3 rounded-2xl border border-line bg-surface py-2 pl-2 pr-4 transition hover:border-line-strong hover:bg-surface-2"
              >
                <IconTile name={c.icon} color={c.color} size={38} />
                <span>
                  <span className="block text-sm font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted">{c._count.courses} formations</span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* MÉTHODE */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionTitle eyebrow="Notre méthode" title="Une pédagogie fondée sur les sciences cognitives" text="Chaque formation s'appuie sur ce que la recherche sait de la mémoire et de la motivation." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{f.text}</p>
                <p className="mt-5 border-t border-line pt-4 text-sm font-semibold text-ink-soft">{f.stat}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* POPULAIRES */}
      <section className="pb-20">
        <Container>
          <SectionTitle
            eyebrow="Les plus suivies"
            title="Formations populaires"
            action={
              <Link href="/courses?sort=popular" className={buttonClass("secondary", "md")}>
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((c) => (
              <CourseCard key={c.id} course={c} currency={currency} />
            ))}
          </div>
        </Container>
      </section>

      {/* CHIFFRES */}
      <section className="py-4">
        <Container>
          <div className="grid gap-px overflow-hidden rounded-[1.75rem] bg-white/10 text-white sm:grid-cols-4" style={{ background: "var(--night)" }}>
            {[
              [formatNumber(courseCount), "formations disponibles"],
              [formatNumber(userCount), "apprenants inscrits"],
              [formatNumber(certCount), "certificats délivrés"],
              [`${rating.toFixed(1)}/5`, "note moyenne des avis"],
            ].map(([v, l]) => (
              <div key={l} className="px-6 py-10 text-center">
                <p className="text-4xl font-bold tracking-tight">{v}</p>
                <p className="mt-1.5 text-sm text-white/65">{l}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* PROGRESSION */}
      <section className="py-20 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">Suivi de progression</p>
            <h2 className="text-3xl font-bold sm:text-[2.25rem] sm:leading-tight">Restez motivé, jour après jour.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Chaque leçon terminée et chaque quiz réussi vous rapportent des points d'expérience. Suivez votre série de jours, obtenez des badges et comparez votre progression à celle des autres apprenants.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {showcase.map((b) => (
                <div key={b.slug} className="card flex flex-col items-center gap-3 p-4 text-center">
                  <BadgeMedal icon={b.icon} color={b.color} size={52} />
                  <span className="text-xs font-semibold">{b.name}</span>
                </div>
              ))}
            </div>
            <Link href="/leaderboard" className={buttonClass("secondary", "lg", "mt-8")}>
              <Trophy className="h-4 w-4" /> Voir le classement
            </Link>
          </div>
          <div className="card p-3 sm:p-5">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-lg font-bold">Meilleurs apprenants</p>
              <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">Depuis le début</span>
            </div>
            <ol className="mt-2 space-y-1.5">
              {top.map((u, i) => {
                const lv = levelInfo(u.xp);
                return (
                  <li key={u.id} className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-surface-2">
                    <span className="w-6 text-center text-sm font-bold text-muted">{i + 1}</span>
                    <Avatar user={u} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{u.name}</p>
                      <p className="text-xs text-muted">
                        Niveau {lv.level} · {lv.title}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink-soft">{formatNumber(u.xp)} XP</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Container>
      </section>

      {/* GRATUITES */}
      <section className="pb-20">
        <Container>
          <SectionTitle
            eyebrow="Pour commencer"
            title="Formations gratuites"
            action={
              <Link href="/courses?price=free" className={buttonClass("secondary", "md")}>
                Toutes les formations gratuites <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {free.map((c) => (
              <CourseCard key={c.id} course={c} currency={currency} />
            ))}
          </div>
        </Container>
      </section>

      {/* AVIS */}
      <section className="border-y border-line bg-bg-soft py-20 sm:py-24">
        <Container>
          <SectionTitle eyebrow="Témoignages" title="Ce qu'en disent les apprenants" />
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card mb-5 break-inside-avoid p-6">
                <Stars value={r.rating} size={15} />
                <blockquote className="mt-3 leading-relaxed text-ink-soft">« {r.comment} »</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar user={r.user} size={38} />
                  <div>
                    <p className="text-sm font-semibold">{r.user.name}</p>
                    <p className="text-xs text-muted">{r.course.title}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* FORMATEURS + INSCRIPTION */}
      <section className="py-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <div className="card p-8 sm:p-10">
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
              <BadgeCheck className="h-4 w-4" /> Formateurs certifiés
            </p>
            <h3 className="text-2xl font-bold sm:text-3xl">Vous avez une expertise à transmettre ?</h3>
            <p className="mt-3 max-w-md text-muted">
              Rejoignez nos formateurs, créez vos formations avec notre studio et touchez des milliers d'apprenants. Chaque profil est vérifié par notre équipe.
            </p>
            <Link href="/become-instructor" className={buttonClass("secondary", "md", "mt-6")}>
              Devenir formateur
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[1.75rem] p-8 text-white sm:p-10" style={{ background: "var(--night)" }}>
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "var(--brand)" }} />
            <h3 className="relative text-2xl font-bold sm:text-3xl">Quinze minutes par jour suffisent.</h3>
            <p className="relative mt-3 max-w-md text-white/70">Fixez votre objectif quotidien, suivez votre première leçon et constatez vos progrès dès la première semaine.</p>
            <Link href="/register" className={buttonClass("primary", "lg", "relative mt-6")}>
              Créer mon compte gratuit
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
