import Link from "next/link";
import { GraduationCap, Lock } from "lucide-react";
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
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand-ink"><GraduationCap className="h-8 w-8" /></span>
        <h1 className="mt-5 text-3xl font-bold">Vous êtes certifié</h1>
        <p className="mt-3 text-muted">Vous avez réussi l'examen final avec {ctx.certificate.score} %. Votre certificat est prêt à être partagé.</p>
        <Link href={`/certificates/${ctx.certificate.code}`} className={buttonClass("primary", "lg", "mt-8")}>
          Voir mon certificat
        </Link>
      </div>
    );
  }

  if (progress < 100) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <ProgressRing value={progress} size={150} stroke={14}>
          <Lock className="h-10 w-10 text-muted" />
        </ProgressRing>
        <h1 className="mt-6 text-2xl font-bold">Examen final</h1>
        <p className="mt-3 text-muted">
          Terminez toutes les leçons pour le débloquer. Votre progression : <span className="font-semibold text-ink">{progress} %</span> ({done} leçons sur {ctx.flat.length}).
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
