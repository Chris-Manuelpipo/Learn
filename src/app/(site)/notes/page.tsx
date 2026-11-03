import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty";
import { CourseCover } from "@/components/course/course-cover";
import { formatClock, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes notes" };

export default async function NotesPage() {
  const user = await requireUser("/notes");
  const notes = await db.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lesson: { select: { id: true, title: true, chapter: { select: { course: { select: { slug: true, title: true, emoji: true, color: true, coverUrl: true } } } } } } },
  });
  const byCourse = new Map<string, typeof notes>();
  for (const n of notes) {
    const k = n.lesson.chapter.course.slug;
    byCourse.set(k, [...(byCourse.get(k) ?? []), n]);
  }

  return (
    <Container className="py-10">
      <PageHeader emoji="📝" title="Mes notes" text="Toutes tes notes, regroupées par cours. Les relire régulièrement, c'est réviser sans effort." />
      {notes.length === 0 ? (
        <EmptyState emoji="📝" title="Pas encore de notes" text="Pendant une leçon, ouvre l'onglet « Mes notes » pour écrire ce que tu retiens." />
      ) : (
        <div className="space-y-10">
          {[...byCourse.entries()].map(([slug, list]) => {
            const course = list[0].lesson.chapter.course;
            return (
              <section key={slug}>
                <div className="mb-4 flex items-center gap-3">
                  <CourseCover course={course} size="sm" className="h-12 w-12 rounded-xl" />
                  <h2 className="text-xl font-extrabold">{course.title}</h2>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-extrabold text-muted">{list.length}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((n) => (
                    <Link key={n.id} href={`/learn/${slug}/${n.lesson.id}`} className="card flex flex-col p-5 transition hover:-translate-y-0.5" style={{ transform: `rotate(${(n.id.charCodeAt(3) % 3) - 1}deg)` }}>
                      <p className="flex-1 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-line pt-3 text-xs font-bold text-muted">
                        <span className="truncate">{n.lesson.title}</span>
                        <span className="shrink-0">{n.timestamp !== null ? `⏱ ${formatClock(n.timestamp)}` : timeAgo(n.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Container>
  );
}
