"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { checkAnswer, submitQuiz, type QuizResult } from "@/app/actions/learn";
import { useCelebrate, fireConfetti } from "@/components/gamification/celebration";
import { Button, buttonClass } from "@/components/ui/button";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type QuizData = { id: string; title: string; passingScore: number; questions: { id: string; text: string; multiple: boolean; options: { id: string; text: string }[] }[] };
type Feedback = { correct: boolean; correctIds: string[]; explanation: string | null };

const PRAISE = ["Bien joué !", "Excellent !", "Parfait !", "Tu gères !", "Bravo !"];

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
        fireConfetti(res.score === 100);
        celebrate(res.reward, { big: !!res.certificateCode });
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
        <p className="text-6xl">🏆</p>
        <h2 className="mt-4 text-3xl font-extrabold">{quiz.title}</h2>
        <p className="mt-3 text-muted">
          {quiz.questions.length} questions · {quiz.passingScore} % de bonnes réponses requis. Prends ton temps, tu peux naviguer entre les questions avant de valider.
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
          <ProgressRing value={result.score} size={140} stroke={14} color={result.passed ? "var(--color-mint)" : "var(--color-coral)"}>
            <span className="font-display text-4xl font-extrabold">{result.score}%</span>
          </ProgressRing>
          <h2 className="mt-5 text-3xl font-extrabold">{result.passed ? (result.score === 100 ? "Sans faute ! 🎯" : "Quiz réussi ! 🎉") : "Presque ! 💪"}</h2>
          <p className="mt-2 text-muted">
            {result.passed
              ? `Tu as obtenu ${result.score} %. Ta mémoire te dit merci.`
              : `Il faut ${quiz.passingScore} % pour valider. Relis les explications ci-dessous et retente : se tromper aide à mieux retenir !`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!result.passed && (
              <Button variant="coral" size="lg" onClick={reset}>
                <RotateCcw className="h-5 w-5" /> Réessayer
              </Button>
            )}
            {result.certificateCode && (
              <Link href={`/certificates/${result.certificateCode}`} className={buttonClass("sun", "lg")}>
                🎓 Voir mon certificat
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
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-white", ok ? "bg-mint" : "bg-coral")}>{ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold">
                      {i + 1}. {qq.text}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Bonne réponse : <span className="font-bold text-mint">{qq.options.filter((o) => right.includes(o.id)).map((o) => o.text).join(", ")}</span>
                    </p>
                    {result.explanations[qq.id] && <p className="mt-1 text-sm text-muted">💡 {result.explanations[qq.id]}</p>}
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
        <ProgressBar value={((index + (feedback ? 1 : 0)) / quiz.questions.length) * 100} height={14} color="linear-gradient(90deg,#1fd1a0,#14b8c4)" />
        <span className="shrink-0 text-sm font-extrabold text-muted">
          {index + 1}/{quiz.questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }}>
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand">{mode === "exam" ? "Examen final" : "Question"}</p>
          <h2 className="mt-2 text-2xl font-extrabold leading-snug sm:text-3xl">{q.text}</h2>
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
                    "flex items-center gap-4 rounded-2xl border-2 p-4 text-left text-[1.02rem] font-semibold transition",
                    state === "idle" && "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                    state === "sel" && "border-brand bg-brand-soft shadow-[0_4px_0_var(--brand)]",
                    state === "right" && "border-mint bg-mint/12 shadow-[0_4px_0_#0ea47b]",
                    state === "wrong" && "border-coral bg-coral/10 shadow-[0_4px_0_#d6402c]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 text-sm font-extrabold",
                      state === "sel" ? "border-brand bg-brand text-on-brand" : state === "right" ? "border-mint bg-mint text-white" : state === "wrong" ? "border-coral bg-coral text-white" : "border-line-strong text-muted",
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
          <span className="hidden text-xs font-bold text-muted sm:block">Astuce : touches 1-4 puis Entrée</span>
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
            className={cn("mt-6 rounded-3xl border-2 p-5", feedback.correct ? "border-mint/50 bg-mint/12" : "border-coral/40 bg-coral/10")}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-3">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl text-white", feedback.correct ? "bg-mint" : "bg-coral")}>{feedback.correct ? "✓" : "✗"}</span>
                <div>
                  <p className={cn("font-display text-xl font-extrabold", feedback.correct ? "text-[#0b8a6a] dark:text-mint" : "text-coral")}>
                    {feedback.correct ? PRAISE[index % PRAISE.length] : "Pas tout à fait…"}
                  </p>
                  {feedback.explanation && <p className="mt-1 text-sm font-medium text-ink-soft">{feedback.explanation}</p>}
                </div>
              </div>
              <Button size="lg" variant={feedback.correct ? "mint" : "coral"} onClick={proceed} loading={pending} autoFocus>
                {isLast ? "Voir mon score" : "Continuer"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
