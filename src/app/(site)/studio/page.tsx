import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, BookOpen, Clapperboard, GraduationCap, Plus, Star, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatPrice } from "@/lib/currency";
import { formatDuration, formatNumber, timeAgo, cn } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { CourseCover } from "@/components/course/course-cover";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/stars";
import { EmptyState } from "@/components/ui/empty";

export const metadata: Metadata = { title: "Studio formateur" };

const STATUS = {
  DRAFT: ["Brouillon", "bg-surface-2 text-muted"],
  PENDING: ["En validation", "bg-sun/20 text-[#9a6200] dark:text-sun"],
  PUBLISHED: ["Publiée", "bg-brand-soft text-brand-ink"],
  ARCHIVED: ["Archivée", "bg-coral/10 text-coral"],
} as const;

export default async function StudioPage() {
  const user = await requireRole(["INSTRUCTOR", "ADMIN"]);
  const courses = await db.course.findMany({ where: { instructorId: user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { chapters: true } } } });
  const ids = courses.map((c) => c.id);
  const [revenue, reviews, monthEnrollments] = await Promise.all([
    db.payment.aggregate({ where: { courseId: { in: ids }, status: "SUCCEEDED" }, _sum: { amountXaf: true } }),
    db.review.findMany({ where: { courseId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 5, include: { user: true, course: { select: { title: true } } } }),
    db.enrollment.count({ where: { courseId: { in: ids }, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
  ]);
  const students = courses.reduce((s, c) => s + c.studentsCount, 0);
  const rated = courses.filter((c) => c.ratingCount);
  const avg = rated.length ? rated.reduce((s, c) => s + c.ratingAvg, 0) / rated.length : 0;

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">Studio formateur</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold sm:text-4xl">
            Bonjour {user.name.split(" ")[0]} {user.instructorVerified && <BadgeCheck className="h-7 w-7 text-brand" />}
          </h1>
          <p className="mt-1 text-muted">{user.instructorVerified ? "Formateur certifié : vos formations sont publiées directement." : "Vos formations sont validées par l'équipe avant publication."}</p>
        </div>
        <Link href="/studio/courses/new" className={buttonClass("primary", "lg")}>
          <Plus className="h-5 w-5" /> Nouvelle formation
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Formations publiées", value: `${courses.filter((c) => c.status === "PUBLISHED").length}/${courses.length}`, color: "text-brand bg-brand-soft" },
          { icon: Users, label: "Apprenants", value: formatNumber(students), sub: `+${monthEnrollments} ces 30 derniers jours`, color: "text-sky bg-sky/15" },
          { icon: Wallet, label: "Revenus", value: formatPrice(revenue._sum.amountXaf ?? 0, "XAF").replace("Gratuit", "0 FCFA"), color: "text-brand-ink bg-brand-soft" },
          { icon: Star, label: "Note moyenne", value: avg ? avg.toFixed(1) : "—", color: "text-[#c98a00] bg-sun/20" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", s.color)}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-3xl font-bold">{s.value}</p>
            <p className="text-sm font-bold text-muted">{s.label}</p>
            {s.sub && <p className="mt-1 text-xs font-bold text-brand-ink">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-4 text-2xl font-bold">Mes formations</h2>
          {courses.length ? (
            <div className="space-y-3">
              {courses.map((c) => (
                <Link key={c.id} href={`/studio/courses/${c.id}`} className="card flex items-center gap-4 p-3 transition hover:-translate-y-0.5 sm:p-4">
                  <CourseCover course={c} size="sm" className="h-16 w-24 shrink-0 rounded-2xl sm:h-20 sm:w-32" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS[c.status][1])}>{STATUS[c.status][0]}</span>
                      {c.certified && <span className="inline-flex items-center gap-1 text-xs text-muted"><GraduationCap className="h-3.5 w-3.5" /> certifiante</span>}
                    </div>
                    <p className="mt-1 truncate font-bold">{c.title}</p>
                    <p className="text-xs font-semibold text-muted">
                      {c._count.chapters} chapitres · {formatDuration(c.durationMinutes)} · {formatPrice(c.price, "XAF")}
                    </p>
                  </div>
                  <div className="hidden text-right text-sm sm:block">
                    <p className="flex items-center justify-end gap-1 font-semibold"><Users className="h-4 w-4 text-muted" /> {formatNumber(c.studentsCount)}</p>
                    <p className="font-bold text-muted">{c.ratingCount ? `${c.ratingAvg.toFixed(1)} ★` : "—"}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Clapperboard} title="Créez votre première formation" text="Commencez par un titre : tout reste modifiable ensuite." action={<Link href="/studio/courses/new" className={buttonClass("primary", "lg")}>Nouvelle formation</Link>} />
          )}
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-bold">Derniers avis</h2>
          <div className="card divide-y divide-line">
            {reviews.length === 0 && <p className="p-5 text-sm text-muted">Pas encore d'avis.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-3 p-4">
                <Avatar user={r.user} size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} size={12} />
                    <span className="text-xs font-semibold text-muted">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm">{r.comment}</p>
                  <p className="mt-1 truncate text-xs font-bold text-muted">{r.course.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
