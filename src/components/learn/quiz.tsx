"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, GraduationCap, RotateCcw, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { checkAnswer, submitQuiz, type QuizResult } from "@/app/actions/learn";
import { useCelebrate } from "@/components/gamification/celebration";
import { Button, buttonClass } from "@/components/ui/button";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type QuizData = { id: string; title: string; passingScore: number; questions: { id: string; text: string; multiple: boolean; options: { id: string; text: string }[] }[] };
type Feedback = { correct: boolean; correctIds: string[]; explanation: string | null };


export function Quiz({ quiz, mode, onPassed, nextHref, readOnly }: { quiz: QuizData; mode: "practice" | "exam"; onPassed?: (r: QuizResult) => void; nextHref?: string | null; readOnly?: boolean }) {
  const [started, setStarted] = useState(mode === "practice");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  const celebrate = useCelebrate();

  const q = quiz.questions[index];
  const selected = answers[q?.id] ?? [];
  const isLast = index === quiz.questions.length - 1;

  const toggle = useCallback(
    (optionId: string) => {
      if (feedback || !q) return;
      setAnswers((a) => {
        const cur = a[q.id] ?? [];
        return { ...a, [q.id]: q.multiple ? (cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]) : [optionId] };
      });
    },
    [feedback, q],
  );

  const finish = () =>
    start(async () => {
      if (readOnly) return void toast("Mode aperçu : les réponses ne sont pas enregistrées.");
      const res = await submitQuiz(quiz.id, answers);
      if ("error" in res) return void toast.error(res.error);
      setResult(res);
      if (res.passed) {
        celebrate(res.reward);
        onPassed?.(res);
      }
    });

  const check = () =>
    start(async () => {
      if (mode === "exam") {
        if (isLast) finish();
        else setIndex(index + 1);
        return;
      }
      const res = await checkAnswer(q.id, selected);
      if ("error" in res) return void toast.error(res.error);
      setFeedback({ correct: res.correct, correctIds: res.correctIds, explanation: res.explanation });
    });

  const proceed = () => {
    setFeedback(null);
    if (isLast) finish();
    else setIndex(index + 1);
  };

  useEffect(() => {
    if (!started || result) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= (q?.options.length ?? 0)) toggle(q.options[n - 1].id);
      if (e.key === "Enter") {
        if (feedback) proceed();
        else if (selected.length && !pending) check();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const reset = () => {
    setAnswers({});
    setIndex(0);
    setResult(null);
    setFeedback(null);
  };

  if (!started) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <Trophy className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-bold">{quiz.title}</h2>
        <p className="mt-3 text-muted">
          {quiz.questions.length} questions · {quiz.passingScore} % de bonnes réponses requis. Prenez votre temps : vous pouvez revenir sur vos réponses avant de valider.
        </p>
        <Button size="lg" className="mt-6" onClick={() => setStarted(true)}>
          Commencer l'examen
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-8 text-center">
          <ProgressRing value={result.score} size={140} stroke={14} color={result.passed ? "var(--brand)" : "var(--color-coral)"}>
            <span className="text-4xl font-bold tracking-tight">{result.score} %</span>
          </ProgressRing>
          <h2 className="mt-5 text-2xl font-bold">{result.passed ? (result.score === 100 ? "Score parfait" : "Quiz réussi") : "Quiz non validé"}</h2>
          <p className="mt-2 text-muted">
            {result.passed
              ? `Vous avez obtenu ${result.score} %.`
              : `Il faut ${quiz.passingScore} % pour valider. Relisez les explications ci-dessous puis réessayez : se tromper aide à mieux retenir.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!result.passed && (
              <Button variant="primary" size="lg" onClick={reset}>
                <RotateCcw className="h-5 w-5" /> Réessayer
              </Button>
            )}
            {result.certificateCode && (
              <Link href={`/certificates/${result.certificateCode}`} className={buttonClass("sun", "lg")}>
                <GraduationCap className="h-5 w-5" /> Voir mon certificat
              </Link>
            )}
            {result.passed && nextHref && (
              <Link href={nextHref} className={buttonClass("primary", "lg")}>
                Continuer
              </Link>
            )}
          </div>
        </motion.div>
        <div className="mt-6 space-y-3">
          {quiz.questions.map((qq, i) => {
            const right = result.correct[qq.id] ?? [];
            const given = answers[qq.id] ?? [];
            const ok = right.length === given.length && right.every((r) => given.includes(r));
            return (
              <div key={qq.id} className="card p-5">
                <div className="flex gap-3">
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-white", ok ? "bg-brand" : "bg-coral")}>{ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}</span>
                  <div className="min-w-0">
                    <p className="font-bold">
                      {i + 1}. {qq.text}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Bonne réponse : <span className="font-semibold text-brand-ink">{qq.options.filter((o) => right.includes(o.id)).map((o) => o.text).join(", ")}</span>
                    </p>
                    {result.explanations[qq.id] && <p className="mt-1 text-sm text-muted">{result.explanations[qq.id]}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <ProgressBar value={((index + (feedback ? 1 : 0)) / quiz.questions.length) * 100} height={8} />
        <span className="shrink-0 text-sm font-bold text-muted">
          {index + 1}/{quiz.questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
          <p className="text-sm font-bold uppercase tracking-wider text-brand">{mode === "exam" ? "Examen final" : "Question"}</p>
          <h2 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">{q.text}</h2>
          {q.multiple && <p className="mt-1 text-sm font-semibold text-muted">Plusieurs réponses possibles</p>}
          <div className="mt-6 grid gap-3">
            {q.options.map((o, i) => {
              const isSel = selected.includes(o.id);
              const isRight = feedback?.correctIds.includes(o.id);
              const state = feedback ? (isRight ? "right" : isSel ? "wrong" : "idle") : isSel ? "sel" : "idle";
              return (
                <motion.button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  animate={state === "wrong" ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left text-[1.02rem] font-medium transition",
                    state === "idle" && "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                    state === "sel" && "border-brand bg-brand-soft ring-1 ring-brand",
                    state === "right" && "border-brand bg-brand-soft ring-1 ring-brand",
                    state === "wrong" && "border-coral bg-coral/8 ring-1 ring-coral",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-semibold",
                      state === "sel" ? "border-brand bg-brand text-on-brand" : state === "right" ? "border-brand bg-brand text-on-brand" : state === "wrong" ? "border-coral bg-coral text-white" : "border-line-strong text-muted",
                    )}
                  >
                    {state === "right" ? <Check className="h-4 w-4" strokeWidth={3} /> : state === "wrong" ? <X className="h-4 w-4" strokeWidth={3} /> : i + 1}
                  </span>
                  {o.text}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        {mode === "exam" && index > 0 ? (
          <Button variant="ghost" onClick={() => setIndex(index - 1)}>
            ← Précédente
          </Button>
        ) : (
          <span className="hidden text-xs text-muted sm:block">Raccourcis : touches 1 à 4, puis Entrée</span>
        )}
        {!feedback && (
          <Button size="lg" onClick={check} disabled={!selected.length} loading={pending} className="ml-auto min-w-40">
            {mode === "exam" ? (isLast ? "Terminer l'examen" : "Suivante") : "Vérifier"}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className={cn("mt-6 rounded-2xl border p-5", feedback.correct ? "border-brand/40 bg-brand-soft" : "border-coral/40 bg-coral/8")}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-3">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full text-white", feedback.correct ? "bg-brand" : "bg-coral")}>{feedback.correct ? <Check className="h-5 w-5" strokeWidth={3} /> : <X className="h-5 w-5" strokeWidth={3} />}</span>
                <div>
                  <p className={cn("text-lg font-bold", feedback.correct ? "text-brand-ink" : "text-coral")}>
                    {feedback.correct ? "Bonne réponse" : "Réponse incorrecte"}
                  </p>
                  {feedback.explanation && <p className="mt-1 text-sm font-medium text-ink-soft">{feedback.explanation}</p>}
                </div>
              </div>
              <Button size="lg" variant={feedback.correct ? "primary" : "secondary"} onClick={proceed} loading={pending} autoFocus>
                {isLast ? "Voir mon score" : "Continuer"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
