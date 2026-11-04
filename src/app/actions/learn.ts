"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardXp, maybeIssueCertificate, refreshEnrollment, type Reward } from "@/lib/progression";
import { XP } from "@/lib/gamification";

async function assertEnrolled(userId: string, courseId: string) {
  const e = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!e) throw new Error("Vous n'êtes pas inscrit à cette formation.");
  return e;
}

export type LessonResult = { reward?: Reward; progress: number; courseCompleted: boolean; certificateCode?: string | null };

export async function completeLesson(lessonId: string): Promise<LessonResult | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId } });
  if (lesson.type === "QUIZ") return { error: "Réussissez le quiz pour valider cette leçon." };
  return markLessonDone(user, lessonId);
}

async function markLessonDone(user: { id: string }, lessonId: string): Promise<LessonResult> {
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { chapter: { include: { course: true } } } });
  const course = lesson.chapter.course;
  await assertEnrolled(user.id, course.id);

  const key = { userId_lessonId: { userId: user.id, lessonId } };
  const prev = await db.lessonProgress.findUnique({ where: key });
  if (prev?.completed) {
    const { progress } = await refreshEnrollment(user.id, course.id);
    return { progress, courseCompleted: false };
  }
  await db.lessonProgress.upsert({
    where: key,
    create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: new Date() },
  });
  await db.enrollment.update({ where: { userId_courseId: { userId: user.id, courseId: course.id } }, data: { lastLessonId: lessonId } });

  const { progress, justCompleted } = await refreshEnrollment(user.id, course.id);
  let reward = await awardXp(user.id, XP.LESSON, "lesson", `Leçon terminée : ${lesson.title}`, lesson.durationMinutes);
  let certificateCode: string | null = null;
  if (justCompleted) {
    const bonus = await awardXp(user.id, XP.COURSE_COMPLETE, "course", `Cours terminé : ${course.title}`);
    reward = mergeRewards(reward, bonus);
    const cert = await maybeIssueCertificate(user.id, course.id);
    if (cert) {
      certificateCode = cert.code;
      reward = mergeRewards(reward, await awardXp(user.id, XP.CERTIFICATE, "certificate", `Certificat : ${course.title}`));
    }
  }
  revalidatePath(`/learn/${course.slug}`, "layout");
  return { reward, progress, courseCompleted: justCompleted, certificateCode };
}

function mergeRewards(a: Reward, b: Reward): Reward {
  return { xp: a.xp + b.xp, levelUp: b.levelUp ?? a.levelUp, badges: [...a.badges, ...b.badges], streak: b.streak };
}

export async function saveWatchProgress(lessonId: string, seconds: number) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, watchedSeconds: Math.floor(seconds) },
    update: { watchedSeconds: Math.floor(seconds) },
  });
}

export type QuizResult = {
  score: number;
  passed: boolean;
  correct: Record<string, string[]>;
  explanations: Record<string, string | null>;
  reward?: Reward;
  progress?: number;
  certificateCode?: string | null;
  courseCompleted?: boolean;
};

export async function submitQuiz(quizId: string, answers: Record<string, string[]>): Promise<QuizResult | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const quiz = await db.quiz.findUniqueOrThrow({
    where: { id: quizId },
    include: { course: true, questions: { include: { options: true } }, lesson: true },
  });
  await assertEnrolled(user.id, quiz.courseId);

  const correct: Record<string, string[]> = {};
  const explanations: Record<string, string | null> = {};
  let good = 0;
  for (const q of quiz.questions) {
    const right = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
    const given = [...(answers[q.id] ?? [])].sort();
    correct[q.id] = right;
    explanations[q.id] = q.explanation;
    if (right.length === given.length && right.every((r, i) => r === given[i])) good++;
  }
  const score = quiz.questions.length ? Math.round((good / quiz.questions.length) * 100) : 0;
  const passed = score >= quiz.passingScore;
  const alreadyPassed = await db.quizAttempt.findFirst({ where: { userId: user.id, quizId, passed: true } });
  await db.quizAttempt.create({ data: { userId: user.id, quizId, score, passed, answers } });

  const result: QuizResult = { score, passed, correct, explanations };
  if (passed && !alreadyPassed) {
    let reward = await awardXp(
      user.id,
      XP.QUIZ_PASS + (score === 100 ? XP.QUIZ_PERFECT_BONUS : 0),
      "quiz",
      `${quiz.isFinal ? "Examen final" : "Quiz"} réussi (${score} %)`,
      3,
    );
    if (quiz.lessonId) {
      const lessonRes = await markLessonDone(user, quiz.lessonId);
      if (lessonRes.reward) reward = mergeRewards(reward, lessonRes.reward);
      result.progress = lessonRes.progress;
      result.courseCompleted = lessonRes.courseCompleted;
      result.certificateCode = lessonRes.certificateCode;
    }
    if (quiz.isFinal) {
      const cert = await maybeIssueCertificate(user.id, quiz.courseId);
      if (cert) {
        result.certificateCode = cert.code;
        reward = mergeRewards(reward, await awardXp(user.id, XP.CERTIFICATE, "certificate", `Certificat : ${quiz.course.title}`));
      }
    }
    result.reward = reward;
  }
  revalidatePath(`/learn/${quiz.course.slug}`, "layout");
  return result;
}

export async function addNote(lessonId: string, content: string, timestamp: number | null) {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  if (!content.trim()) return { error: "La note est vide." };
  const note = await db.note.create({ data: { userId: user.id, lessonId, content: content.trim().slice(0, 2000), timestamp } });
  const count = await db.note.count({ where: { userId: user.id } });
  let reward: Reward | undefined;
  if (count === 10) reward = await awardXp(user.id, 0, "note", "10 notes écrites");
  return { note: { id: note.id, content: note.content, timestamp: note.timestamp, createdAt: note.createdAt.toISOString() }, reward };
}

export async function deleteNote(noteId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.note.deleteMany({ where: { id: noteId, userId: user.id } });
  revalidatePath("/notes");
}

/** Correction immédiate d'une question (quiz d'entraînement uniquement, jamais l'examen final). */
export async function checkAnswer(questionId: string, optionIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const q = await db.question.findUniqueOrThrow({ where: { id: questionId }, include: { options: true, quiz: true } });
  if (q.quiz.isFinal) return { error: "Indisponible pendant l'examen." };
  await assertEnrolled(user.id, q.quiz.courseId);
  const right = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
  const given = [...optionIds].sort();
  return { correct: right.length === given.length && right.every((r, i) => r === given[i]), correctIds: right, explanation: q.explanation };
}
