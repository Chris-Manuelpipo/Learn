import "server-only";
import { cache } from "react";
import { db } from "./db";

export const getLearnContext = cache(async (slug: string, userId: string) => {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { id: true, name: true, avatarEmoji: true, avatarColor: true, avatarUrl: true, instructorVerified: true } },
      chapters: {
        orderBy: { position: "asc" },
        include: { lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, type: true, durationMinutes: true, chapterId: true } } },
      },
      quizzes: { where: { isFinal: true }, select: { id: true } },
    },
  });
  if (!course) return null;
  const lessonIds = course.chapters.flatMap((c) => c.lessons.map((l) => l.id));
  const [enrollment, progress, certificate, examPassed] = await Promise.all([
    db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } }),
    db.lessonProgress.findMany({ where: { userId, lessonId: { in: lessonIds }, completed: true }, select: { lessonId: true } }),
    db.certificate.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } }),
    course.quizzes[0] ? db.quizAttempt.findFirst({ where: { userId, quizId: course.quizzes[0].id, passed: true } }) : null,
  ]);
  const flat = course.chapters.flatMap((c) => c.lessons.map((l) => ({ ...l, chapterTitle: c.title })));
  return {
    course,
    enrollment,
    completed: new Set(progress.map((p) => p.lessonId)),
    flat,
    certificate,
    finalQuizId: course.quizzes[0]?.id ?? null,
    examPassed: !!examPassed,
  };
});
