"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveQuiz, type QuestionInput } from "@/app/actions/studio";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const blank = (): QuestionInput => ({ text: "", explanation: "", options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] });

export function QuizEditor({ courseId, target, initial, passingScore: initialScore, title, onSaved }: { courseId: string; target: { quizId?: string; isFinal?: boolean }; initial: QuestionInput[]; passingScore: number; title: string; onSaved?: () => void }) {
  const [questions, setQuestions] = useState<QuestionInput[]>(initial.length ? initial : [blank()]);
  const [score, setScore] = useState(initialScore);
  const [pending, start] = useTransition();
  const router = useRouter();

  const update = (i: number, q: Partial<QuestionInput>) => setQuestions((qs) => qs.map((x, k) => (k === i ? { ...x, ...q } : x)));

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-lg font-bold">{title}</p>
          <p className="text-sm text-muted">{questions.length} question{questions.length > 1 ? "s" : ""}</p>
        </div>
        <label className="flex items-center gap-3 text-sm font-bold">
          Score pour réussir
          <Input type="number" min={10} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="h-10 w-20" />%
        </label>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pink/15 font-bold text-pink">{i + 1}</span>
            <Input value={q.text} onChange={(e) => update(i, { text: e.target.value })} placeholder="Intitulé de la question" />
            <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, k) => k !== i))} className="grid h-12 w-10 shrink-0 place-items-center text-muted hover:text-coral" aria-label="Supprimer la question">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 pl-12">
            {q.options.map((o, j) => (
              <div key={j} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update(i, { options: q.options.map((x, k) => (k === j ? { ...x, isCorrect: !x.isCorrect } : x)) })}
                  className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition", o.isCorrect ? "border-brand bg-brand text-on-brand" : "border-line-strong text-transparent hover:border-brand")}
                  aria-label={o.isCorrect ? "Bonne réponse" : "Marquer comme bonne réponse"}
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
                <Input value={o.text} onChange={(e) => update(i, { options: q.options.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)) })} placeholder={`Réponse ${j + 1}`} className="h-10" />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => update(i, { options: q.options.filter((_, k) => k !== j) })} className="text-muted hover:text-coral" aria-label="Retirer la réponse">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {q.options.length < 6 && (
              <button type="button" onClick={() => update(i, { options: [...q.options, { text: "", isCorrect: false }] })} className="text-sm font-bold text-brand hover:underline">
                + Ajouter une réponse
              </button>
            )}
            <Textarea value={q.explanation} onChange={(e) => update(i, { explanation: e.target.value })} placeholder="Explication affichée après la réponse (recommandé : c'est là que l'apprentissage se fait !)" className="min-h-16 text-sm" />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={() => setQuestions((qs) => [...qs, blank()])}>
          <Plus className="h-4 w-4" /> Question
        </Button>
        <Button
          type="button"
          loading={pending}
          className="ml-auto"
          onClick={() =>
            start(async () => {
              try {
                const res = await saveQuiz(courseId, target, questions, score);
                if (res.error) return void toast.error(res.error);
                toast.success("Quiz enregistré");
                router.refresh();
                onSaved?.();
              } catch (e) {
                toast.error((e as Error).message);
              }
            })
          }
        >
          Enregistrer le quiz
        </Button>
      </div>
    </div>
  );
}
