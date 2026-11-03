import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Brain, Flame, GraduationCap, Repeat, Sparkles, Timer } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { Container, SectionTitle } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { HeroVisual } from "@/components/home/hero-visual";
import { palette } from "@/lib/colors";
import { formatNumber } from "@/lib/utils";
import { levelInfo } from "@/lib/gamification";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const currency = await getCurrency();
  const [categories, popular, free, stats, reviews, learners, top] = await Promise.all([
    db.category.findMany({ include: { _count: { select: { courses: { where: { status: "PUBLISHED" } } } } } }),
    db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ studentsCount: "desc" }], take: 8, select: courseCardSelect }),
    db.course.findMany({ where: { status: "PUBLISHED", price: 0 }, orderBy: { ratingAvg: "desc" }, take: 4, select: courseCardSelect }),
    Promise.all([
      db.course.count({ where: { status: "PUBLISHED" } }),
      db.user.count(),
      db.certificate.count(),
      db.review.aggregate({ _avg: { rating: true } }),
    ]),
    db.review.findMany({ where: { rating: 5 }, take: 6, orderBy: { createdAt: "desc" }, include: { user: true, course: { select: { title: true } } } }),
    db.user.findMany({ where: { role: "STUDENT" }, take: 5, orderBy: { xp: "desc" } }),
    db.user.findMany({ orderBy: { xp: "desc" }, take: 5 }),
  ]);
  const [courseCount, userCount, certCount, avg] = stats;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="bg-dots absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <Container className="relative grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <Link href="/courses?certified=1" className="group mb-6 inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface py-1.5 pl-1.5 pr-4 text-sm font-bold shadow-sm transition hover:border-brand">
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-extrabold text-white">Nouveau</span>
              Certificats vérifiables par QR code
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Apprends ce qui te <span className="text-gradient">fait vibrer</span>, <span className="squiggle">à ton rythme</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Des cours vidéo courts, des quiz qui font travailler ta mémoire et des certificats qui comptent. {formatNumber(courseCount)} cours en français, pensés pour que ça reste.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonClass("primary", "lg")}>
                Commencer gratuitement <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/courses" className={buttonClass("secondary", "lg")}>
                Explorer le catalogue
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {learners.map((u) => (
                  <Avatar key={u.id} user={u} size={44} ring />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1.5">
                  <Stars value={avg._avg.rating ?? 5} />
                  <span className="font-extrabold">{(avg._avg.rating ?? 5).toFixed(1)}/5</span>
                </div>
                <p className="font-semibold text-muted">
                  Rejoins <span className="font-extrabold text-ink">{formatNumber(userCount)}</span> apprenants motivés
                </p>
              </div>
            </div>
          </div>
          <HeroVisual />
        </Container>
      </section>

      {/* CATÉGORIES */}
      <section className="border-y border-line bg-surface/60 py-6">
        <Container>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {categories.map((c) => {
              const p = palette(c.color);
              return (
                <Link
                  key={c.id}
                  href={`/courses?category=${c.slug}`}
                  className="group flex shrink-0 items-center gap-3 rounded-2xl border-2 border-line bg-surface py-2 pl-2 pr-5 transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-2xl transition group-hover:scale-110 group-hover:-rotate-6" style={{ background: `color-mix(in srgb, ${p.from} 18%, transparent)` }}>
                    {c.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold">{c.name}</span>
                    <span className="block text-xs font-semibold text-muted">{c._count.courses} cours</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* SCIENCES COGNITIVES */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionTitle
            eyebrow="Une méthode qui marche"
            title={
              <>
                Conçu pour ton cerveau, <span className="text-brand">pas contre lui</span>
              </>
            }
            text="On s'appuie sur ce que la recherche en sciences cognitives sait de la mémoire et de la motivation."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Timer, color: "violet", title: "Micro-leçons", text: "Des vidéos de 5 à 12 minutes. Ton attention reste au top et tu avances même entre deux cours.", stat: "≈ 8 min" },
              { icon: Brain, color: "pink", title: "Rappel actif", text: "Un quiz à la fin de chaque chapitre : récupérer l'information est ce qui l'ancre durablement.", stat: "+50 % de rétention" },
              { icon: Flame, color: "coral", title: "Habitudes", text: "Objectif quotidien, séries de jours et rappels : la régularité bat l'intensité.", stat: "15 min / jour" },
              { icon: GraduationCap, color: "sun", title: "Certificats", text: "Un examen final et un certificat vérifiable par QR code, à partager sur LinkedIn.", stat: "100 % vérifiable" },
            ].map((f, i) => {
              const p = palette(f.color);
              return (
                <div key={f.title} className="card group relative overflow-hidden p-6 transition hover:-translate-y-1">
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-15 transition group-hover:scale-125" style={{ background: p.from }} />
                  <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})`, transform: `rotate(${i % 2 ? 4 : -4}deg)` }}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-extrabold">{f.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{f.text}</p>
                  <p className="mt-4 inline-block rounded-full bg-surface-2 px-3 py-1 text-xs font-extrabold" style={{ color: p.ink }}>
                    {f.stat}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* POPULAIRES */}
      <section className="pb-20">
        <Container>
          <SectionTitle
            eyebrow="Les plus suivis"
            title="Les cours qui cartonnent 🔥"
            action={
              <Link href="/courses?sort=popular" className={buttonClass("soft", "md")}>
                Tout voir <ArrowRight className="h-4 w-4" />
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

      {/* STATS */}
      <section className="py-6">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6d4aff] via-[#8b5cff] to-[#c54bff] px-6 py-12 text-white sm:px-12">
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-[#ff5fa2]/30 blur-2xl" />
            <div className="relative grid gap-8 text-center sm:grid-cols-4">
              {[
                [formatNumber(courseCount), "cours disponibles"],
                [formatNumber(userCount), "apprenants"],
                [formatNumber(certCount), "certificats délivrés"],
                [`${(avg._avg.rating ?? 0).toFixed(1)}/5`, "note moyenne"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-4xl font-extrabold sm:text-5xl">{v}</p>
                  <p className="mt-1 font-semibold text-white/75">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* GAMIFICATION */}
      <section className="py-20 sm:py-28">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-brand">Apprendre devient un jeu</p>
            <h2 className="text-4xl font-extrabold sm:text-5xl">
              Gagne de l'XP, monte de niveau, <span className="text-gradient">grimpe au classement</span>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Chaque leçon terminée, chaque quiz réussi te rapporte de l'XP. Débloque des badges, entretiens ta série de jours et mesure-toi aux autres apprenants chaque semaine.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["👣", "Premier pas"],
                ["🔥", "Semaine de feu"],
                ["🎯", "Sans faute"],
                ["🎓", "Certifié"],
              ].map(([e, n], i) => (
                <div key={n} className="card flex flex-col items-center gap-2 p-4 text-center" style={{ transform: `rotate(${[-3, 2, -2, 3][i]}deg)` }}>
                  <span className="text-4xl">{e}</span>
                  <span className="text-xs font-extrabold">{n}</span>
                </div>
              ))}
            </div>
            <Link href="/leaderboard" className={buttonClass("primary", "lg", "mt-8")}>
              Voir le classement <Sparkles className="h-5 w-5" />
            </Link>
          </div>
          <div className="card p-3 sm:p-5">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="font-display text-xl font-extrabold">🏆 Top apprenants</p>
              <span className="rounded-full bg-sun/20 px-3 py-1 text-xs font-extrabold text-[#9a6200] dark:text-sun">Tous les temps</span>
            </div>
            <ol className="mt-2 space-y-2">
              {top.map((u, i) => {
                const lv = levelInfo(u.xp);
                return (
                  <li key={u.id} className={`flex items-center gap-4 rounded-2xl p-3 ${i === 0 ? "bg-sun/15" : "bg-surface-2"}`}>
                    <span className="w-8 text-center font-display text-xl font-extrabold text-muted">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                    <Avatar user={u} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold">{u.name}</p>
                      <p className="text-xs font-semibold text-muted">
                        Niveau {lv.level} · {lv.title}
                      </p>
                    </div>
                    <span className="font-display font-extrabold text-brand">{formatNumber(u.xp)} XP</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Container>
      </section>

      {/* GRATUITS */}
      <section className="pb-20">
        <Container>
          <SectionTitle
            eyebrow="Zéro franc, zéro excuse"
            title="Commence avec un cours gratuit 🎁"
            action={
              <Link href="/courses?price=free" className={buttonClass("soft", "md")}>
                Cours gratuits <ArrowRight className="h-4 w-4" />
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
      <section className="bg-bg-soft py-20 sm:py-24">
        <Container>
          <SectionTitle eyebrow="Ils en parlent" title="Des apprenants qui ont pris goût à apprendre 💬" />
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card mb-5 break-inside-avoid p-6">
                <Stars value={r.rating} size={16} />
                <blockquote className="mt-3 text-[1.05rem] leading-relaxed">« {r.comment} »</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar user={r.user} size={40} />
                  <div>
                    <p className="text-sm font-extrabold">{r.user.name}</p>
                    <p className="text-xs text-muted">{r.course.title}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* FORMATEURS + CTA */}
      <section className="py-20">
        <Container className="grid gap-6 lg:grid-cols-2">
          <div className="card relative overflow-hidden p-8 sm:p-10">
            <div className="absolute -right-6 -top-6 text-[8rem] opacity-15">🧑‍🏫</div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wider text-sky">
              <BadgeCheck className="h-4 w-4" /> Formateurs certifiés
            </p>
            <h3 className="text-3xl font-extrabold">Tu as un savoir à partager ?</h3>
            <p className="mt-3 max-w-md text-muted">
              Rejoins nos formateurs, crée tes cours avec notre studio et touche des milliers d'apprenants. Chaque profil est vérifié par notre équipe.
            </p>
            <Link href="/become-instructor" className={buttonClass("secondary", "md", "mt-6")}>
              Devenir formateur
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#16122b] p-8 text-white sm:p-10 dark:bg-brand-soft">
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-[#ffc23d] to-[#ff5fa2] opacity-80 blur-sm" />
            <Repeat className="relative h-10 w-10 text-sun" />
            <h3 className="relative mt-4 text-3xl font-extrabold">15 minutes par jour suffisent.</h3>
            <p className="relative mt-3 max-w-md text-white/70">Fixe ton objectif, lance ta première leçon et regarde ta série grandir.</p>
            <Link href="/register" className={buttonClass("sun", "lg", "relative mt-6")}>
              Créer mon compte gratuit
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
