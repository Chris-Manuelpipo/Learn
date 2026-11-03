import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Calendar, Globe, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { levelInfo } from "@/lib/gamification";
import { formatDate, formatNumber } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { CourseCover } from "@/components/course/course-cover";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const u = await db.user.findUnique({ where: { username: (await params).username }, select: { name: true } });
  return { title: u?.name ?? "Profil" };
}

export default async function PublicProfile({ params }: Props) {
  const { username } = await params;
  const profile = await db.user.findUnique({ where: { username } });
  if (!profile) notFound();
  const [me, currency, badges, certs, completed, taught] = await Promise.all([
    getCurrentUser(),
    getCurrency(),
    db.userBadge.findMany({ where: { userId: profile.id }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
    db.certificate.findMany({ where: { userId: profile.id }, include: { course: true }, orderBy: { issuedAt: "desc" } }),
    db.enrollment.count({ where: { userId: profile.id, completedAt: { not: null } } }),
    profile.role !== "STUDENT" ? db.course.findMany({ where: { instructorId: profile.id, status: "PUBLISHED" }, select: courseCardSelect, orderBy: { studentsCount: "desc" } }) : [],
  ]);
  const level = levelInfo(profile.xp);
  const isMe = me?.id === profile.id;

  return (
    <div>
      <div className="h-44 bg-gradient-to-r from-grad-a to-grad-b sm:h-56" />
      <Container>
        <div className="-mt-20 flex flex-col gap-5 sm:flex-row sm:items-end">
          <Avatar user={profile} size={144} ring className="shadow-xl" />
          <div className="flex-1 pb-2">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold sm:text-4xl">
              {profile.name}
              {profile.instructorVerified && <BadgeCheck className="h-7 w-7 text-sky" aria-label="Formateur certifié" />}
            </h1>
            <p className="font-semibold text-muted">@{profile.username}{profile.headline && ` · ${profile.headline}`}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-muted">
              {profile.country && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.country}</span>}
              {profile.website && <a href={profile.website} className="flex items-center gap-1 hover:text-brand" target="_blank" rel="noopener noreferrer"><Globe className="h-4 w-4" /> Site web</a>}
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Membre depuis {formatDate(profile.createdAt, { month: "long", year: "numeric" })}</span>
            </div>
          </div>
          {isMe && <Link href="/profile" className={buttonClass("secondary", "md", "mb-2")}>Modifier mon profil</Link>}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5 sm:col-span-2">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-2xl font-extrabold">Niveau {level.level} <span className="text-brand">· {level.title}</span></p>
              <p className="text-sm font-bold text-muted">{formatNumber(profile.xp)} XP</p>
            </div>
            <ProgressBar value={level.percent} className="mt-3" height={12} color="linear-gradient(90deg,var(--grad-a),var(--grad-b))" />
          </div>
          <Stat emoji="🔥" value={profile.streak} label={`jours de série (record ${profile.bestStreak})`} />
          <Stat emoji="🎓" value={certs.length} label={`certificats · ${completed} cours terminés`} />
        </div>

        {profile.bio && <p className="card mt-6 p-6 leading-relaxed text-ink-soft">{profile.bio}</p>}

        {taught.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-extrabold">Cours de {profile.name.split(" ")[0]}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {taught.map((c) => <CourseCard key={c.id} course={c} currency={currency} />)}
            </div>
          </section>
        )}

        {certs.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-extrabold">Certificats</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certs.map((c) => (
                <Link key={c.id} href={`/certificates/${c.code}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
                  <CourseCover course={c.course} size="sm" className="h-14 w-14 shrink-0 rounded-2xl" />
                  <div className="min-w-0">
                    <p className="truncate font-extrabold">{c.course.title}</p>
                    <p className="text-xs font-semibold text-muted">{formatDate(c.issuedAt)} · {c.score} %</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-extrabold">Badges ({badges.length})</h2>
          {badges.length ? (
            <div className="flex flex-wrap gap-3">
              {badges.map(({ badge }) => (
                <div key={badge.id} className="card flex items-center gap-3 py-2 pl-2 pr-4" title={badge.description}>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-2xl">{badge.emoji}</span>
                  <span className="text-sm font-extrabold">{badge.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">Aucun badge pour l'instant.</p>
          )}
        </section>
      </Container>
    </div>
  );
}

function Stat({ emoji, value, label }: { emoji: string; value: number; label: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="text-4xl">{emoji}</span>
      <div>
        <p className="font-display text-3xl font-extrabold">{value}</p>
        <p className="text-xs font-bold text-muted">{label}</p>
      </div>
    </div>
  );
}
