import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLearnContext } from "@/lib/learn";
import { Quiz } from "@/components/learn/quiz";
import { ProgressRing } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const ctx = await getLearnContext(slug, user.id);
  if (!ctx || !ctx.finalQuizId) notFound();

  const done = ctx.flat.filter((l) => ctx.completed.has(l.id)).length;
  const progress = Math.round((done / ctx.flat.length) * 100);
  const nextLesson = ctx.flat.find((l) => !ctx.completed.has(l.id));

  if (ctx.certificate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-7xl">🎓</p>
        <h1 className="mt-4 text-4xl font-extrabold">Tu es certifié·e !</h1>
        <p className="mt-3 text-muted">Tu as réussi l'examen final avec {ctx.certificate.score} %. Ton certificat est prêt à être partagé.</p>
        <Link href={`/certificates/${ctx.certificate.code}`} className={buttonClass("sun", "lg", "mt-8")}>
          Voir mon certificat
        </Link>
      </div>
    );
  }

  if (progress < 100) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <ProgressRing value={progress} size={150} stroke={14}>
          <span className="text-5xl">🔒</span>
        </ProgressRing>
        <h1 className="mt-6 text-3xl font-extrabold">L'examen final t'attend</h1>
        <p className="mt-3 text-muted">
          Termine toutes les leçons pour le débloquer. Tu en es à <span className="font-extrabold text-brand">{progress} %</span> ({done}/{ctx.flat.length} leçons). Encore un petit effort !
        </p>
        {nextLesson && (
          <Link href={`/learn/${slug}/${nextLesson.id}`} className={buttonClass("primary", "lg", "mt-8")}>
            Continuer : {nextLesson.title}
          </Link>
        )}
      </div>
    );
  }

  const quiz = await db.quiz.findUniqueOrThrow({
    where: { id: ctx.finalQuizId },
    include: { questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" }, select: { id: true, text: true } } } } },
  });

  return (
    <div className="px-4 py-10 sm:px-8">
      <Quiz
        mode="exam"
        readOnly={!ctx.enrollment}
        quiz={{ id: quiz.id, title: quiz.title, passingScore: quiz.passingScore, questions: quiz.questions.map((q) => ({ id: q.id, text: q.text, multiple: q.multiple, options: q.options })) }}
      />
    </div>
  );
}
