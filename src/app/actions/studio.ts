"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { PALETTE_KEYS } from "@/lib/colors";
import type { FormState } from "./auth";

async function instructor() {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") throw new Error("Accès réservé aux formateurs.");
  return user;
}

async function ownCourse(courseId: string) {
  const user = await instructor();
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId } });
  if (course.instructorId !== user.id && user.role !== "ADMIN") throw new Error("Ce cours ne t'appartient pas.");
  return { user, course };
}

async function courseOfChapter(chapterId: string) {
  const ch = await db.chapter.findUniqueOrThrow({ where: { id: chapterId } });
  await ownCourse(ch.courseId);
  return ch.courseId;
}

async function courseOfLesson(lessonId: string) {
  const l = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { chapter: true } });
  await ownCourse(l.chapter.courseId);
  return l.chapter.courseId;
}

async function refreshDuration(courseId: string) {
  const agg = await db.lesson.aggregate({ where: { chapter: { courseId } }, _sum: { durationMinutes: true } });
  await db.course.update({ where: { id: courseId }, data: { durationMinutes: agg._sum.durationMinutes ?? 0 } });
  revalidatePath(`/studio/courses/${courseId}`);
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || "cours";
  let slug = base;
  let i = 1;
  while (await db.course.findFirst({ where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) } })) slug = `${base}-${++i}`;
  return slug;
}

const InfoSchema = z.object({
  title: z.string().trim().min(5, "Titre : 5 caractères minimum").max(90),
  subtitle: z.string().trim().min(10, "Sous-titre : 10 caractères minimum").max(160),
  description: z.string().trim().max(5000).default(""),
  categoryId: z.string().min(1, "Choisis une catégorie"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  price: z.coerce.number().int().min(0).max(1_000_000),
  emoji: z.string().min(1).max(8),
  color: z.enum(PALETTE_KEYS as [string, ...string[]]),
  certified: z.coerce.boolean().default(false),
  outcomes: z.string().default(""),
  requirements: z.string().default(""),
});

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 12);

export async function createCourse(_: FormState, formData: FormData): Promise<FormState> {
  const user = await instructor();
  const parsed = InfoSchema.safeParse({ ...Object.fromEntries(formData), certified: formData.get("certified") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const course = await db.course.create({
    data: {
      title: d.title,
      subtitle: d.subtitle,
      description: d.description || d.subtitle,
      slug: await uniqueSlug(d.title),
      categoryId: d.categoryId,
      level: d.level,
      price: d.price,
      emoji: d.emoji,
      color: d.color,
      certified: d.certified,
      outcomes: lines(d.outcomes),
      requirements: lines(d.requirements),
      instructorId: user.id,
      status: "DRAFT",
      chapters: { create: { title: "Introduction", position: 0 } },
    },
  });
  redirect(`/studio/courses/${course.id}?tab=curriculum`);
}

export async function updateCourseInfo(courseId: string, _: FormState, formData: FormData): Promise<FormState> {
  await ownCourse(courseId);
  const parsed = InfoSchema.safeParse({ ...Object.fromEntries(formData), certified: formData.get("certified") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.course.update({
    where: { id: courseId },
    data: { ...d, description: d.description || d.subtitle, outcomes: lines(d.outcomes), requirements: lines(d.requirements) },
  });
  revalidatePath(`/studio/courses/${courseId}`);
  return { ok: true, message: "Informations enregistrées ✅" };
}

export async function addChapter(courseId: string, title: string) {
  await ownCourse(courseId);
  const count = await db.chapter.count({ where: { courseId } });
  await db.chapter.create({ data: { courseId, title: title.trim() || `Chapitre ${count + 1}`, position: count } });
  revalidatePath(`/studio/courses/${courseId}`);
}

export async function renameChapter(chapterId: string, title: string) {
  const courseId = await courseOfChapter(chapterId);
  await db.chapter.update({ where: { id: chapterId }, data: { title: title.trim() || "Sans titre" } });
  revalidatePath(`/studio/courses/${courseId}`);
}

export async function deleteChapter(chapterId: string) {
  const courseId = await courseOfChapter(chapterId);
  await db.chapter.delete({ where: { id: chapterId } });
  const rest = await db.chapter.findMany({ where: { courseId }, orderBy: { position: "asc" } });
  await db.$transaction(rest.map((c, i) => db.chapter.update({ where: { id: c.id }, data: { position: i } })));
  await refreshDuration(courseId);
}

export async function moveChapter(chapterId: string, dir: -1 | 1) {
  const courseId = await courseOfChapter(chapterId);
  const list = await db.chapter.findMany({ where: { courseId }, orderBy: { position: "asc" } });
  const i = list.findIndex((c) => c.id === chapterId);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((c, k) => db.chapter.update({ where: { id: c.id }, data: { position: k } })));
  revalidatePath(`/studio/courses/${courseId}`);
}

const LessonSchema = z.object({
  title: z.string().trim().min(2, "Titre trop court").max(120),
  type: z.enum(["VIDEO", "ARTICLE", "QUIZ"]),
  durationMinutes: z.coerce.number().int().min(1).max(240),
  videoUrl: z.string().trim().max(500).optional().nullable(),
  content: z.string().max(20000).optional().nullable(),
  isPreview: z.boolean().default(false),
});
export type LessonInput = z.input<typeof LessonSchema>;

export async function addLesson(chapterId: string, input: LessonInput) {
  const courseId = await courseOfChapter(chapterId);
  const parsed = LessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.type === "VIDEO" && d.videoUrl && !/^(https?:\/\/|\/)/.test(d.videoUrl)) return { error: "L'URL de la vidéo doit commencer par http(s):// ou / (fichier local)" };
  const count = await db.lesson.count({ where: { chapterId } });
  const lesson = await db.lesson.create({
    data: { chapterId, title: d.title, type: d.type, durationMinutes: d.durationMinutes, videoUrl: d.type === "VIDEO" ? d.videoUrl || null : null, content: d.type === "QUIZ" ? null : d.content || null, isPreview: d.isPreview, position: count },
  });
  if (d.type === "QUIZ") await db.quiz.create({ data: { courseId, lessonId: lesson.id, title: d.title, passingScore: 60 } });
  await refreshDuration(courseId);
  return { ok: true };
}

export async function updateLesson(lessonId: string, input: LessonInput) {
  const courseId = await courseOfLesson(lessonId);
  const parsed = LessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const prev = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, include: { quiz: true } });
  await db.lesson.update({
    where: { id: lessonId },
    data: { title: d.title, type: d.type, durationMinutes: d.durationMinutes, videoUrl: d.type === "VIDEO" ? d.videoUrl || null : null, content: d.type === "QUIZ" ? null : d.content || null, isPreview: d.isPreview },
  });
  if (d.type === "QUIZ" && !prev.quiz) await db.quiz.create({ data: { courseId, lessonId, title: d.title, passingScore: 60 } });
  if (d.type !== "QUIZ" && prev.quiz) await db.quiz.delete({ where: { id: prev.quiz.id } });
  await refreshDuration(courseId);
  return { ok: true };
}

export async function deleteLesson(lessonId: string) {
  const courseId = await courseOfLesson(lessonId);
  const l = await db.lesson.delete({ where: { id: lessonId } });
  const rest = await db.lesson.findMany({ where: { chapterId: l.chapterId }, orderBy: { position: "asc" } });
  await db.$transaction(rest.map((x, i) => db.lesson.update({ where: { id: x.id }, data: { position: i } })));
  await refreshDuration(courseId);
}

export async function moveLesson(lessonId: string, dir: -1 | 1) {
  const courseId = await courseOfLesson(lessonId);
  const l = await db.lesson.findUniqueOrThrow({ where: { id: lessonId } });
  const list = await db.lesson.findMany({ where: { chapterId: l.chapterId }, orderBy: { position: "asc" } });
  const i = list.findIndex((x) => x.id === lessonId);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((x, k) => db.lesson.update({ where: { id: x.id }, data: { position: k } })));
  revalidatePath(`/studio/courses/${courseId}`);
}

export type QuestionInput = { text: string; explanation: string; options: { text: string; isCorrect: boolean }[] };

/** Remplace l'ensemble des questions d'un quiz (de leçon ou examen final). */
export async function saveQuiz(courseId: string, target: { quizId?: string; isFinal?: boolean }, questions: QuestionInput[], passingScore: number) {
  await ownCourse(courseId);
  const clean = questions
    .map((q) => ({ ...q, text: q.text.trim(), options: q.options.filter((o) => o.text.trim()) }))
    .filter((q) => q.text);
  for (const [i, q] of clean.entries()) {
    if (q.options.length < 2) return { error: `Question ${i + 1} : au moins 2 réponses.` };
    if (!q.options.some((o) => o.isCorrect)) return { error: `Question ${i + 1} : coche au moins une bonne réponse.` };
  }
  let quizId = target.quizId;
  if (!quizId && target.isFinal) {
    const existing = await db.quiz.findFirst({ where: { courseId, isFinal: true } });
    quizId = existing?.id ?? (await db.quiz.create({ data: { courseId, isFinal: true, title: "Examen final", passingScore } })).id;
  }
  if (!quizId) return { error: "Quiz introuvable." };
  const quiz = await db.quiz.findUniqueOrThrow({ where: { id: quizId } });
  if (quiz.courseId !== courseId) return { error: "Quiz invalide." };

  await db.$transaction([
    db.question.deleteMany({ where: { quizId } }),
    db.quiz.update({ where: { id: quizId }, data: { passingScore: Math.min(100, Math.max(10, passingScore)) } }),
    ...clean.map((q, i) =>
      db.question.create({
        data: {
          quizId: quizId!,
          text: q.text,
          explanation: q.explanation.trim() || null,
          position: i,
          multiple: q.options.filter((o) => o.isCorrect).length > 1,
          options: { create: q.options.map((o, j) => ({ text: o.text.trim(), isCorrect: o.isCorrect, position: j })) },
        },
      }),
    ),
  ]);
  revalidatePath(`/studio/courses/${courseId}`);
  return { ok: true };
}

export async function submitCourse(courseId: string) {
  const { user, course } = await ownCourse(courseId);
  const lessons = await db.lesson.count({ where: { chapter: { courseId } } });
  if (lessons < 3) return { error: "Ajoute au moins 3 leçons avant de publier." };
  if (course.certified) {
    const final = await db.quiz.findFirst({ where: { courseId, isFinal: true }, include: { _count: { select: { questions: true } } } });
    if (!final || final._count.questions < 3) return { error: "Un cours certifiant nécessite un examen final d'au moins 3 questions." };
  }
  const direct = user.role === "ADMIN" || user.instructorVerified;
  await db.course.update({ where: { id: courseId }, data: direct ? { status: "PUBLISHED", publishedAt: course.publishedAt ?? new Date() } : { status: "PENDING" } });
  if (!direct) {
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title: "Cours à valider", body: `« ${course.title} » attend ta validation.`, emoji: "📥", href: "/admin/courses?status=PENDING" })) });
  }
  revalidatePath(`/studio/courses/${courseId}`);
  revalidatePath("/studio");
  return { ok: true, published: direct };
}

export async function unpublishCourse(courseId: string) {
  await ownCourse(courseId);
  await db.course.update({ where: { id: courseId }, data: { status: "DRAFT" } });
  revalidatePath(`/studio/courses/${courseId}`);
  revalidatePath("/studio");
}

export async function deleteCourse(courseId: string) {
  const { course } = await ownCourse(courseId);
  if (course.studentsCount > 0) return { error: "Impossible de supprimer un cours qui a des apprenants. Dépublie-le plutôt." };
  await db.course.delete({ where: { id: courseId } });
  redirect("/studio");
}
