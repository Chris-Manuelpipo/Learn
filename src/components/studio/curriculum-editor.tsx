"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowUp, FileText, HelpCircle, Pencil, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { addChapter, addLesson, deleteChapter, deleteLesson, moveChapter, moveLesson, renameChapter, updateLesson, type LessonInput, type QuestionInput } from "@/app/actions/studio";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { QuizEditor } from "./quiz-editor";

type Lesson = { id: string; title: string; type: "VIDEO" | "ARTICLE" | "QUIZ"; durationMinutes: number; videoUrl: string | null; content: string | null; isPreview: boolean; quiz: { id: string; passingScore: number; questions: QuestionInput[] } | null };
type Chapter = { id: string; title: string; lessons: Lesson[] };

const TYPES = [
  { v: "VIDEO", label: "Vidéo", icon: PlayCircle, color: "text-brand" },
  { v: "ARTICLE", label: "Article", icon: FileText, color: "text-sky" },
  { v: "QUIZ", label: "Quiz", icon: HelpCircle, color: "text-pink" },
] as const;

export function CurriculumEditor({ courseId, chapters }: { courseId: string; chapters: Chapter[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [newChapter, setNewChapter] = useState("");
  const [editing, setEditing] = useState<{ chapterId: string; lesson?: Lesson } | null>(null);
  const [quizFor, setQuizFor] = useState<Lesson | null>(null);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      try {
        const res = (await fn()) as { error?: string } | undefined;
        if (res?.error) toast.error(res.error);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  return (
    <div className={cn("mx-auto max-w-4xl space-y-4", pending && "opacity-70")}>
      {chapters.map((ch, ci) => (
        <div key={ch.id} className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line bg-surface-2/60 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft font-bold text-brand">{ci + 1}</span>
            <input
              defaultValue={ch.title}
              onBlur={(e) => e.target.value !== ch.title && run(() => renameChapter(ch.id, e.target.value))}
              className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 font-bold outline-none focus:bg-surface focus:ring-2 focus:ring-brand/30"
              aria-label="Titre du chapitre"
            />
            <IconBtn label="Monter" disabled={ci === 0} onClick={() => run(() => moveChapter(ch.id, -1))}><ArrowUp className="h-4 w-4" /></IconBtn>
            <IconBtn label="Descendre" disabled={ci === chapters.length - 1} onClick={() => run(() => moveChapter(ch.id, 1))}><ArrowDown className="h-4 w-4" /></IconBtn>
            <IconBtn label="Supprimer le chapitre" danger onClick={() => confirm(`Supprimer « ${ch.title} » et ses leçons ?`) && run(() => deleteChapter(ch.id))}><Trash2 className="h-4 w-4" /></IconBtn>
          </div>
          <ul className="divide-y divide-line">
            {ch.lessons.map((l, li) => {
              const T = TYPES.find((t) => t.v === l.type)!;
              return (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <T.icon className={cn("h-5 w-5 shrink-0", T.color)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{l.title}</p>
                    <p className="text-xs font-semibold text-muted">
                      {T.label} · {l.durationMinutes} min {l.isPreview && "· aperçu gratuit"}
                      {l.type === "QUIZ" && ` · ${l.quiz?.questions.length ?? 0} questions`}
                      {l.type === "VIDEO" && !l.videoUrl && <span className="text-coral"> · vidéo manquante</span>}
                    </p>
                  </div>
                  {l.type === "QUIZ" && (
                    <Button size="sm" variant="soft" onClick={() => setQuizFor(l)}>Questions</Button>
                  )}
                  <IconBtn label="Modifier" onClick={() => setEditing({ chapterId: ch.id, lesson: l })}><Pencil className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Monter" disabled={li === 0} onClick={() => run(() => moveLesson(l.id, -1))}><ArrowUp className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Descendre" disabled={li === ch.lessons.length - 1} onClick={() => run(() => moveLesson(l.id, 1))}><ArrowDown className="h-4 w-4" /></IconBtn>
                  <IconBtn label="Supprimer" danger onClick={() => confirm(`Supprimer « ${l.title} » ?`) && run(() => deleteLesson(l.id))}><Trash2 className="h-4 w-4" /></IconBtn>
                </li>
              );
            })}
          </ul>
          <button onClick={() => setEditing({ chapterId: ch.id })} className="flex w-full items-center justify-center gap-2 border-t border-dashed border-line py-3 text-sm font-bold text-brand transition hover:bg-brand-soft/50">
            <Plus className="h-4 w-4" /> Ajouter une leçon
          </button>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await addChapter(courseId, newChapter);
            setNewChapter("");
          });
        }}
        className="flex gap-3 rounded-[1.75rem] border border-dashed border-line-strong p-3"
      >
        <Input value={newChapter} onChange={(e) => setNewChapter(e.target.value)} placeholder="Titre du nouveau chapitre…" />
        <Button type="submit" loading={pending}><Plus className="h-4 w-4" /> Chapitre</Button>
      </form>

      <LessonDialog
        key={editing?.lesson?.id ?? editing?.chapterId ?? "none"}
        state={editing}
        onClose={() => setEditing(null)}
        onSave={(input) =>
          run(async () => {
            const res = editing?.lesson ? await updateLesson(editing.lesson.id, input) : await addLesson(editing!.chapterId, input);
            if (!res?.error) {
              toast.success(editing?.lesson ? "Leçon mise à jour" : "Leçon ajoutée");
              setEditing(null);
            }
            return res;
          })
        }
        pending={pending}
      />

      <Dialog.Root open={!!quizFor} onOpenChange={(o) => !o && setQuizFor(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-x-3 top-[4vh] z-[81] mx-auto max-h-[92vh] max-w-3xl overflow-y-auto rounded-3xl bg-bg p-5 shadow-2xl sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold">{quizFor?.title}</Dialog.Title>
              <Dialog.Close className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Fermer"><X className="h-5 w-5" /></Dialog.Close>
            </div>
            {quizFor?.quiz && (
              <QuizEditor
                courseId={courseId}
                target={{ quizId: quizFor.quiz.id }}
                initial={quizFor.quiz.questions}
                passingScore={quizFor.quiz.passingScore}
                title="Questions du quiz"
                onSaved={() => setQuizFor(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function IconBtn({ children, onClick, label, disabled, danger }: { children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 disabled:opacity-30", danger ? "hover:text-coral" : "hover:text-ink")}>
      {children}
    </button>
  );
}

function LessonDialog({ state, onClose, onSave, pending }: { state: { chapterId: string; lesson?: Lesson } | null; onClose: () => void; onSave: (i: LessonInput) => void; pending: boolean }) {
  const l = state?.lesson;
  const [type, setType] = useState<Lesson["type"]>(l?.type ?? "VIDEO");
  const [title, setTitle] = useState(l?.title ?? "");
  const [duration, setDuration] = useState(l?.durationMinutes ?? 8);
  const [videoUrl, setVideoUrl] = useState(l?.videoUrl ?? "");
  const [content, setContent] = useState(l?.content ?? "");
  const [isPreview, setIsPreview] = useState(l?.isPreview ?? false);

  return (
    <Dialog.Root open={!!state} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-3 top-[5vh] z-[81] mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-2xl font-bold">{l ? "Modifier la leçon" : "Nouvelle leçon"}</Dialog.Title>
            <Dialog.Close className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Fermer"><X className="h-5 w-5" /></Dialog.Close>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button key={t.v} type="button" onClick={() => setType(t.v)} className={cn("flex flex-col items-center gap-1.5 rounded-2xl border p-3 font-bold transition", type === t.v ? "border-brand bg-brand-soft" : "border-line hover:border-line-strong")}>
                  <t.icon className={cn("h-6 w-6", t.color)} /> {t.label}
                </button>
              ))}
            </div>
            <Field label="Titre"><Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus /></Field>
            <Field label="Durée estimée (minutes)"><Input type="number" min={1} max={240} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></Field>
            {type === "VIDEO" && (
              <Field label="URL de la vidéo (MP4)" hint="Lien direct vers un fichier vidéo (CDN, bucket) ou chemin local, ex. /videos/flower.mp4">
                <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/video.mp4" />
              </Field>
            )}
            {type !== "QUIZ" && (
              <Field label={type === "ARTICLE" ? "Contenu (Markdown)" : "Résumé de la leçon (Markdown)"} hint="## Titre, **gras**, - liste, 1. liste numérotée, > astuce">
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="font-mono text-sm" />
              </Field>
            )}
            {type === "QUIZ" && <p className="rounded-2xl bg-pink/10 p-4 text-sm font-semibold">Après l'enregistrement, clique sur « Questions » pour rédiger les questions du quiz.</p>}
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} className="h-5 w-5 accent-[var(--brand)]" />
              <span className="text-sm font-bold">Aperçu gratuit (visible sans inscription)</span>
            </label>
            <Button className="w-full" size="lg" loading={pending} onClick={() => onSave({ title, type, durationMinutes: duration, videoUrl, content, isPreview })}>
              {l ? "Enregistrer" : "Ajouter la leçon"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
