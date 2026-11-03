import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Star, Users, Wallet, BookOpen, BadgeCheck } from "lucide-react";
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
  PUBLISHED: ["Publié", "bg-mint/15 text-[#0b8a6a] dark:text-mint"],
  ARCHIVED: ["Archivé", "bg-coral/10 text-coral"],
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
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand">Studio formateur</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold sm:text-4xl">
            Bonjour {user.name.split(" ")[0]} {user.instructorVerified && <BadgeCheck className="h-7 w-7 text-sky" />}
          </h1>
          <p className="mt-1 text-muted">{user.instructorVerified ? "Formateur certifié : tes cours sont publiés directement." : "Tes cours sont validés par l'équipe avant publication."}</p>
        </div>
        <Link href="/studio/courses/new" className={buttonClass("primary", "lg")}>
          <Plus className="h-5 w-5" /> Nouveau cours
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Cours publiés", value: `${courses.filter((c) => c.status === "PUBLISHED").length}/${courses.length}`, color: "text-brand bg-brand-soft" },
          { icon: Users, label: "Apprenants", value: formatNumber(students), sub: `+${monthEnrollments} ces 30 derniers jours`, color: "text-sky bg-sky/15" },
          { icon: Wallet, label: "Revenus", value: formatPrice(revenue._sum.amountXaf ?? 0, "XAF").replace("Gratuit", "0 FCFA"), color: "text-mint bg-mint/15" },
          { icon: Star, label: "Note moyenne", value: avg ? avg.toFixed(1) : "—", color: "text-[#c98a00] bg-sun/20" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", s.color)}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold">{s.value}</p>
            <p className="text-sm font-bold text-muted">{s.label}</p>
            {s.sub && <p className="mt-1 text-xs font-bold text-mint">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_380px]">
        <section>
          <h2 className="mb-4 text-2xl font-extrabold">Mes cours</h2>
          {courses.length ? (
            <div className="space-y-3">
              {courses.map((c) => (
                <Link key={c.id} href={`/studio/courses/${c.id}`} className="card flex items-center gap-4 p-3 transition hover:-translate-y-0.5 sm:p-4">
                  <CourseCover course={c} size="sm" className="h-16 w-24 shrink-0 rounded-2xl sm:h-20 sm:w-32" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold", STATUS[c.status][1])}>{STATUS[c.status][0]}</span>
                      {c.certified && <span className="text-xs font-bold text-muted">🎓 certifiant</span>}
                    </div>
                    <p className="mt-1 truncate font-extrabold">{c.title}</p>
                    <p className="text-xs font-semibold text-muted">
                      {c._count.chapters} chapitres · {formatDuration(c.durationMinutes)} · {formatPrice(c.price, "XAF")}
                    </p>
                  </div>
                  <div className="hidden text-right text-sm sm:block">
                    <p className="font-extrabold">{formatNumber(c.studentsCount)} 👥</p>
                    <p className="font-bold text-muted">{c.ratingCount ? `${c.ratingAvg.toFixed(1)} ★` : "—"}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState emoji="🎬" title="Crée ton premier cours" text="Commence par un titre : tu pourras tout modifier ensuite." action={<Link href="/studio/courses/new" className={buttonClass("primary", "lg")}>Nouveau cours</Link>} />
          )}
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-extrabold">Derniers avis</h2>
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
