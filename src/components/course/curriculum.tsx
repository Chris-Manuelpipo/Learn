"use client";

import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, FileText, HelpCircle, Lock, PlayCircle, Trophy, X } from "lucide-react";
import { useState } from "react";
import { formatDuration } from "@/lib/utils";

type Lesson = { id: string; title: string; type: "VIDEO" | "ARTICLE" | "QUIZ"; durationMinutes: number; isPreview: boolean; videoUrl: string | null };
type Chapter = { id: string; title: string; summary: string | null; lessons: Lesson[] };

const ICON = { VIDEO: PlayCircle, ARTICLE: FileText, QUIZ: HelpCircle };

export function Curriculum({ chapters, finalExam }: { chapters: Chapter[]; finalExam: number | null }) {
  const [preview, setPreview] = useState<Lesson | null>(null);
  return (
    <>
      <Accordion.Root type="multiple" defaultValue={[chapters[0]?.id]} className="space-y-3">
        {chapters.map((ch, i) => {
          const minutes = ch.lessons.reduce((s, l) => s + l.durationMinutes, 0);
          return (
            <Accordion.Item key={ch.id} value={ch.id} className="card overflow-hidden">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-surface-2 sm:p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-lg font-extrabold text-brand">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold leading-snug">{ch.title}</span>
                    <span className="block text-sm font-semibold text-muted">
                      {ch.lessons.length} leçons · {formatDuration(minutes)}
                    </span>
                  </span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[collapse_.25s_ease] data-[state=open]:animate-[expand_.25s_ease]">
                <ul className="border-t border-line px-2 py-2 sm:px-3">
                  {ch.lessons.map((l) => {
                    const Icon = ICON[l.type];
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          disabled={!l.isPreview || l.type !== "VIDEO"}
                          onClick={() => setPreview(l)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] enabled:cursor-pointer enabled:hover:bg-brand-soft/60"
                        >
                          <Icon className={`h-[18px] w-[18px] shrink-0 ${l.type === "QUIZ" ? "text-pink" : "text-muted"}`} />
                          <span className="flex-1 font-medium text-ink-soft">{l.title}</span>
                          {l.isPreview && l.type === "VIDEO" ? (
                            <span className="rounded-full bg-mint/15 px-2 py-0.5 text-xs font-extrabold text-mint">Aperçu</span>
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-muted/60" />
                          )}
                          <span className="w-14 text-right text-xs font-semibold text-muted">{l.durationMinutes} min</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
        {finalExam && (
          <div className="flex items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-sun/60 bg-sun/10 p-4 sm:p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun text-[#4a2f00]">
              <Trophy className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-extrabold">Examen final & certificat</span>
              <span className="block text-sm font-semibold text-muted">{finalExam} questions · 70 % requis pour obtenir ton certificat</span>
            </span>
          </div>
        )}
      </Accordion.Root>

      <Dialog.Root open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(94vw,900px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-[#111315] shadow-2xl">
            <div className="flex items-center justify-between gap-4 p-4 text-white">
              <Dialog.Title className="font-display text-lg font-extrabold">Aperçu · {preview?.title}</Dialog.Title>
              <Dialog.Close className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/10" aria-label="Fermer">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            {preview?.videoUrl && <video src={preview.videoUrl} controls autoPlay className="aspect-video w-full bg-black" />}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
