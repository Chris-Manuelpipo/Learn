"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, FileText, NotebookPen, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addNote, completeLesson, deleteNote, saveWatchProgress } from "@/app/actions/learn";
import { useCelebrate } from "@/components/gamification/celebration";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";
import { cn, formatClock } from "@/lib/utils";
import { VideoPlayer, type PlayerHandle } from "./video-player";
import { Quiz, type QuizData } from "./quiz";

type Note = { id: string; content: string; timestamp: number | null; createdAt: string };

type Props = {
  courseSlug: string;
  lesson: { id: string; title: string; type: "VIDEO" | "ARTICLE" | "QUIZ"; videoUrl: string | null; content: string | null; durationMinutes: number; chapterTitle: string; chapterIndex: number; position: number; total: number };
  quiz: QuizData | null;
  done: boolean;
  resumeAt: number;
  notes: Note[];
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
  hasExam: boolean;
  readOnly: boolean;
};

export function LessonView({ courseSlug, lesson, quiz, done: initialDone, resumeAt, notes: initialNotes, prev, next, hasExam, readOnly }: Props) {
  const router = useRouter();
  const celebrate = useCelebrate();
  const player = useRef<PlayerHandle>(null);
  const [done, setDone] = useState(initialDone);
  const [pending, start] = useTransition();
  const lastSave = useRef(0);
  const nextHref = next ? `/learn/${courseSlug}/${next.id}` : hasExam ? `/learn/${courseSlug}/exam` : null;

  const complete = (auto = false) => {
    if (done || readOnly) return;
    start(async () => {
      const res = await completeLesson(lesson.id);
      if ("error" in res) return void toast.error(res.error);
      setDone(true);
      if (res.courseCompleted) {
        celebrate(res.reward);
        toast.success(res.certificateCode ? "Formation terminée, votre certificat est disponible" : hasExam ? "Toutes les leçons sont terminées : l'examen final est disponible" : "Formation terminée");
      } else {
        celebrate(res.reward);
        if (auto) toast("Leçon validée", { duration: 1800 });
      }
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-brand">Chapitre {lesson.chapterIndex}</span>
        <span className="truncate">{lesson.chapterTitle}</span>
        <span className="ml-auto flex items-center gap-1">
          <Clock className="h-4 w-4" /> {lesson.durationMinutes} min · Leçon {lesson.position}/{lesson.total}
        </span>
      </div>

      {lesson.type === "QUIZ" && quiz ? (
        <div className="py-4">
          <Quiz quiz={quiz} mode="practice" nextHref={nextHref} readOnly={readOnly} onPassed={() => setDone(true)} />
        </div>
      ) : (
        <>
          {lesson.type === "VIDEO" && lesson.videoUrl && (
            <VideoPlayer
              ref={player}
              src={lesson.videoUrl}
              resumeAt={resumeAt}
              onProgress={(t) => {
                if (!readOnly && Date.now() - lastSave.current > 10000) {
                  lastSave.current = Date.now();
                  saveWatchProgress(lesson.id, t);
                }
              }}
              onNearEnd={() => complete(true)}
            />
          )}

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
                {lesson.type === "ARTICLE" ? <FileText className="h-7 w-7 shrink-0 text-brand" /> : <PlayCircle className="h-7 w-7 shrink-0 text-brand" />}
                {lesson.title}
              </h1>
            </div>
            {done ? (
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-soft px-4 py-2.5 font-semibold text-brand-ink">
                <CheckCircle2 className="h-5 w-5" /> Terminée
              </span>
            ) : (
              <Button variant="primary" onClick={() => complete()} loading={pending} disabled={readOnly} className="shrink-0">
                <CheckCircle2 className="h-5 w-5" /> {lesson.type === "ARTICLE" ? "J'ai terminé la lecture" : "Marquer comme terminée"}
              </Button>
            )}
          </div>

          <Tabs.Root defaultValue={lesson.type === "ARTICLE" ? "content" : "content"} className="mt-6">
            <Tabs.List className="flex gap-1 border-b-2 border-line">
              {[
                ["content", lesson.type === "ARTICLE" ? "Lecture" : "Résumé de la leçon"],
                ["notes", `Mes notes (${initialNotes.length})`],
              ].map(([v, l]) => (
                <Tabs.Trigger
                  key={v}
                  value={v}
                  className="-mb-[2px] border-b-[3px] border-transparent px-4 py-3 text-sm font-bold text-muted transition hover:text-ink data-[state=active]:border-brand data-[state=active]:text-brand"
                >
                  {l}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            <Tabs.Content value="content" className="py-6">
              {lesson.content ? <Markdown source={lesson.content} /> : <p className="text-muted">Pas de contenu écrit pour cette leçon.</p>}
            </Tabs.Content>
            <Tabs.Content value="notes" className="py-6">
              <NotesPanel lessonId={lesson.id} initial={initialNotes} player={lesson.type === "VIDEO" ? player : null} readOnly={readOnly} />
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}

      <nav className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/learn/${courseSlug}/${prev.id}`} className="group card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
            <ArrowLeft className="h-5 w-5 text-muted transition group-hover:-translate-x-1" />
            <span className="min-w-0">
              <span className="block text-xs font-bold text-muted">Précédente</span>
              <span className="block truncate font-bold">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nextHref && (
          <Link
            href={nextHref}
            className={cn("group flex items-center justify-end gap-3 rounded-[1.75rem] p-4 text-right transition hover:-translate-y-0.5", done ? "bg-brand text-on-brand shadow-sm" : "card")}
          >
            <span className="min-w-0">
              <span className={cn("block text-xs font-bold", done ? "text-white/75" : "text-muted")}>{next ? "Leçon suivante" : "Dernière étape"}</span>
              <span className="block truncate font-bold">{next ? next.title : "Examen final"}</span>
            </span>
            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
          </Link>
        )}
      </nav>
    </div>
  );
}

function NotesPanel({ lessonId, initial, player, readOnly }: { lessonId: string; initial: Note[]; player: React.RefObject<PlayerHandle | null> | null; readOnly: boolean }) {
  const [notes, setNotes] = useState(initial);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const celebrate = useCelebrate();

  const add = () =>
    start(async () => {
      const ts = player?.current ? Math.floor(player.current.time()) : null;
      const res = await addNote(lessonId, text, ts);
      if ("error" in res && res.error) return void toast.error(res.error);
      if ("note" in res && res.note) {
        setNotes((n) => [...n, res.note!].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)));
        setText("");
        toast.success("Note enregistrée");
        celebrate(res.reward);
      }
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="card h-fit p-5">
        <p className="flex items-center gap-2 font-bold">
          <NotebookPen className="h-5 w-5 text-brand" /> Nouvelle note
        </p>
        <p className="mt-1 text-sm text-muted">{player ? "Elle sera liée au moment actuel de la vidéo." : "Reformulez avec vos propres mots : c'est ainsi que l'on retient."}</p>
        <Textarea
          className="mt-3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ce que je retiens…"
          disabled={readOnly}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) add();
          }}
        />
        <Button className="mt-3 w-full" onClick={add} loading={pending} disabled={!text.trim() || readOnly}>
          Ajouter la note
        </Button>
      </div>
      <div className="space-y-3">
        {notes.length === 0 && <p className="rounded-3xl border border-dashed border-line p-8 text-center text-sm font-semibold text-muted">Aucune note pour cette leçon. Les notes les plus utiles tiennent en une phrase.</p>}
        {notes.map((n) => (
          <div key={n.id} className="group card flex gap-3 p-4">
            {n.timestamp !== null && (
              <button
                onClick={() => player?.current?.seek(n.timestamp!)}
                className="h-fit shrink-0 rounded-lg bg-brand-soft px-2 py-1 font-mono text-xs font-bold text-brand transition hover:bg-brand hover:text-on-brand"
                title="Aller à ce moment"
              >
                {formatClock(n.timestamp)}
              </button>
            )}
            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">{n.content}</p>
            <button
              onClick={() =>
                start(async () => {
                  await deleteNote(n.id);
                  setNotes((x) => x.filter((y) => y.id !== n.id));
                })
              }
              className="h-fit rounded-lg p-1 text-muted opacity-0 transition hover:text-coral group-hover:opacity-100"
              aria-label="Supprimer la note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
