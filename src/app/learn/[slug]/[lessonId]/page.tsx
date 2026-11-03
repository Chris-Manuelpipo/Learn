import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLearnContext } from "@/lib/learn";
import { LessonView } from "@/components/learn/lesson-view";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  const user = await requireUser();
  const ctx = await getLearnContext(slug, user.id);
  if (!ctx) notFound();
  const index = ctx.flat.findIndex((l) => l.id === lessonId);
  if (index === -1) notFound();

  const [lesson, notes, watch] = await Promise.all([
    db.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      include: {
        quiz: { include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" }, select: { id: true, text: true } } } } } },
      },
    }),
    db.note.findMany({ where: { userId: user.id, lessonId }, orderBy: [{ timestamp: "asc" }, { createdAt: "asc" }] }),
    db.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } }),
  ]);
  if (ctx.enrollment) {
    await db.enrollment.update({ where: { id: ctx.enrollment.id }, data: { lastLessonId: lessonId, lastAccessAt: new Date() } });
  }

  const meta = ctx.flat[index];
  const prev = ctx.flat[index - 1] ?? null;
  const next = ctx.flat[index + 1] ?? null;
  const chapterIndex = ctx.course.chapters.findIndex((c) => c.id === meta.chapterId);

  return (
    <LessonView
      key={lessonId}
      courseSlug={slug}
      lesson={{
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        durationMinutes: lesson.durationMinutes,
        chapterTitle: meta.chapterTitle,
        chapterIndex: chapterIndex + 1,
        position: index + 1,
        total: ctx.flat.length,
      }}
      quiz={
        lesson.quiz
          ? {
              id: lesson.quiz.id,
              title: lesson.quiz.title,
              passingScore: lesson.quiz.passingScore,
              questions: lesson.quiz.questions.map((q) => ({ id: q.id, text: q.text, multiple: q.multiple, options: q.options })),
            }
          : null
      }
      done={ctx.completed.has(lessonId)}
      resumeAt={watch?.watchedSeconds ?? 0}
      notes={notes.map((n) => ({ id: n.id, content: n.content, timestamp: n.timestamp, createdAt: n.createdAt.toISOString() }))}
      prev={prev ? { id: prev.id, title: prev.title } : null}
      next={next ? { id: next.id, title: next.title } : null}
      hasExam={!!ctx.finalQuizId}
      readOnly={!ctx.enrollment}
    />
  );
}
