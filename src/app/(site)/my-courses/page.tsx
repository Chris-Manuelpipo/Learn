import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Flag, Heart } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { Container, PageHeader } from "@/components/ui/section";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { EmptyState } from "@/components/ui/empty";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes cours" };

const TABS = [
  ["progress", "En cours", BookOpen],
  ["done", "Terminées", Flag],
  ["favorites", "Favoris", Heart],
] as const;

export default async function MyCoursesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser("/my-courses");
  const { tab = "progress" } = await searchParams;
  const currency = await getCurrency();
  const [enrollments, favorites] = await Promise.all([
    db.enrollment.findMany({ where: { userId: user.id }, orderBy: { lastAccessAt: "desc" }, include: { course: { select: courseCardSelect } } }),
    db.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { course: { select: courseCardSelect } } }),
  ]);
  const inProgress = enrollments.filter((e) => e.progress < 100);
  const done = enrollments.filter((e) => e.progress === 100);
  const counts = { progress: inProgress.length, done: done.length, favorites: favorites.length };

  return (
    <Container className="py-10">
      <PageHeader icon={BookOpen} title="Mes formations" text="Retrouvez toutes vos formations et reprenez exactement là où vous vous êtes arrêté." />
      <div className="mb-8 flex gap-2 overflow-x-auto">
        {TABS.map(([k, l, TabIcon]) => (
          <Link
            key={k}
            href={`/my-courses?tab=${k}`}
            className={cn("flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition", tab === k ? "bg-brand text-on-brand" : "bg-surface text-ink-soft ring-1 ring-line hover:ring-line-strong")}
          >
            <TabIcon className="h-4 w-4" /> {l}
            <span className={cn("rounded-full px-2 text-xs", tab === k ? "bg-white/25" : "bg-surface-2")}>{counts[k]}</span>
          </Link>
        ))}
      </div>
      {tab === "favorites" ? (
        favorites.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((f) => (
              <CourseCard key={f.courseId} course={f.course} currency={currency} favorite />
            ))}
          </div>
        ) : (
          <EmptyState icon={Heart} title="Aucun favori pour le moment" text="Cliquez sur le cœur d'une formation pour la retrouver ici." action={<Link href="/courses" className={buttonClass("primary", "lg")}>Explorer</Link>} />
        )
      ) : (tab === "done" ? done : inProgress).length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(tab === "done" ? done : inProgress).map((e) => (
            <CourseCard key={e.id} course={e.course} currency={currency} progress={e.progress} href={`/learn/${e.course.slug}`} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === "done" ? Flag : BookOpen}
          title={tab === "done" ? "Pas encore de cours terminé" : "Aucun cours en cours"}
          text={tab === "done" ? "Chaque leçon vous rapproche de la fin de votre formation." : "Trouvez la formation qui vous intéresse et commencez dès aujourd'hui."}
          action={<Link href="/courses" className={buttonClass("primary", "lg")}>Explorer le catalogue</Link>}
        />
      )}
    </Container>
  );
}
