import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLearnContext } from "@/lib/learn";
import { LearnShell } from "@/components/learn/learn-shell";

export default async function LearnLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/learn/${slug}`);
  const ctx = await getLearnContext(slug, user.id);
  if (!ctx) notFound();
  const isOwner = user.role === "ADMIN" || user.id === ctx.course.instructorId;
  if (!ctx.enrollment && !isOwner) redirect(`/courses/${slug}`);

  const total = ctx.flat.length;
  const done = ctx.flat.filter((l) => ctx.completed.has(l.id)).length;

  return (
    <LearnShell
      course={{ slug: ctx.course.slug, title: ctx.course.title, certified: ctx.course.certified }}
      chapters={ctx.course.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        lessons: c.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, durationMinutes: l.durationMinutes, done: ctx.completed.has(l.id) })),
      }))}
      progress={total ? Math.round((done / total) * 100) : 0}
      hasExam={!!ctx.finalQuizId}
      examPassed={ctx.examPassed}
      certificateCode={ctx.certificate?.code ?? null}
      user={{ xp: user.xp, streak: user.streak }}
    >
      {children}
    </LearnShell>
  );
}
