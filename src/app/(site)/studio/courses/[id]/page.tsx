import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDuration, cn } from "@/lib/utils";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { CourseInfoForm } from "@/components/studio/course-info-form";
import { CurriculumEditor } from "@/components/studio/curriculum-editor";
import { QuizEditor } from "@/components/studio/quiz-editor";
import { PublishPanel } from "@/components/studio/publish-panel";

export const metadata: Metadata = { title: "Éditer le cours" };

const TABS = [
  ["info", "📝 Informations"],
  ["curriculum", "📚 Programme"],
  ["exam", "🏆 Examen final"],
  ["publish", "🚀 Publication"],
] as const;

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requireRole(["INSTRUCTOR", "ADMIN"]);
  const { id } = await params;
  const { tab = "info" } = await searchParams;
  const course = await db.course.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: { quiz: { include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } } },
          },
        },
      },
      quizzes: { where: { isFinal: true }, include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } } } },
    },
  });
  if (!course) notFound();
  if (course.instructorId !== user.id && user.role !== "ADMIN") redirect("/studio");
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const final = course.quizzes[0];
  const lessonCount = course.chapters.reduce((s, c) => s + c.lessons.length, 0);
  const toQuestions = (qs: NonNullable<typeof final>["questions"]) => qs.map((q) => ({ text: q.text, explanation: q.explanation ?? "", options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) }));

  return (
    <Container className="py-8">
      <Link href="/studio" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Studio
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{course.emoji}</span>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{course.title}</h1>
            <p className="text-sm font-semibold text-muted">
              {course.chapters.length} chapitres · {lessonCount} leçons · {formatDuration(course.durationMinutes)}
            </p>
          </div>
        </div>
        <Link href={`/courses/${course.slug}`} className={buttonClass("secondary", "md")} target="_blank">
          <Eye className="h-4 w-4" /> Aperçu
        </Link>
      </div>
      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto border-b-2 border-line">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`?tab=${k}`} className={cn("-mb-[2px] shrink-0 border-b-[3px] px-4 py-3 text-sm font-extrabold transition", tab === k ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink")}>
            {l}
          </Link>
        ))}
      </div>

      {tab === "info" && (
        <CourseInfoForm
          categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
          initial={{ id: course.id, slug: course.slug, title: course.title, subtitle: course.subtitle, description: course.description, categoryId: course.categoryId, level: course.level, price: course.price, emoji: course.emoji, color: course.color, certified: course.certified, outcomes: course.outcomes, requirements: course.requirements }}
        />
      )}
      {tab === "curriculum" && (
        <CurriculumEditor
          courseId={course.id}
          chapters={course.chapters.map((c) => ({
            id: c.id,
            title: c.title,
            lessons: c.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              type: l.type,
              durationMinutes: l.durationMinutes,
              videoUrl: l.videoUrl,
              content: l.content,
              isPreview: l.isPreview,
              quiz: l.quiz ? { id: l.quiz.id, passingScore: l.quiz.passingScore, questions: toQuestions(l.quiz.questions) } : null,
            })),
          }))}
        />
      )}
      {tab === "exam" && (
        <div className="mx-auto max-w-3xl">
          {!course.certified && <p className="mb-6 rounded-2xl bg-sun/15 p-4 text-sm font-semibold">Ce cours n'est pas certifiant : l'examen final est facultatif. Active « Cours certifiant » dans les informations pour délivrer des certificats.</p>}
          <QuizEditor courseId={course.id} target={{ isFinal: true, quizId: final?.id }} initial={final ? toQuestions(final.questions) : []} passingScore={final?.passingScore ?? 70} title="Examen final" />
        </div>
      )}
      {tab === "publish" && <PublishPanel courseId={course.id} status={course.status} lessons={lessonCount} certified={course.certified} examQuestions={final?.questions.length ?? 0} verified={user.instructorVerified || user.role === "ADMIN"} students={course.studentsCount} />}
    </Container>
  );
}
