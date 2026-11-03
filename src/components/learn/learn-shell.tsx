"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Check, ChevronDown, ChevronLeft, FileText, HelpCircle, Lock, PanelLeftClose, PanelLeftOpen, PlayCircle, Trophy, X } from "lucide-react";
import { LogoMark } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Lesson = { id: string; title: string; type: "VIDEO" | "ARTICLE" | "QUIZ"; durationMinutes: number; done: boolean };
type Chapter = { id: string; title: string; lessons: Lesson[] };

const ICON = { VIDEO: PlayCircle, ARTICLE: FileText, QUIZ: HelpCircle };

export function LearnShell({
  course,
  chapters,
  progress,
  hasExam,
  examPassed,
  certificateCode,
  user,
  children,
}: {
  course: { slug: string; title: string; certified: boolean };
  chapters: Chapter[];
  progress: number;
  hasExam: boolean;
  examPassed: boolean;
  certificateCode: string | null;
  user: { xp: number; streak: number };
  children: React.ReactNode;
}) {
  const params = useParams<{ lessonId?: string }>();
  const pathname = usePathname();
  const [sidebar, setSidebar] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const onExam = pathname.endsWith("/exam");

  const list = (
    <div className="space-y-2 p-3">
      {chapters.map((ch, ci) => {
        const done = ch.lessons.filter((l) => l.done).length;
        const isClosed = closed.has(ch.id) && !ch.lessons.some((l) => l.id === params.lessonId);
        return (
          <div key={ch.id}>
            <button
              onClick={() => setClosed((s) => { const n = new Set(s); if (n.has(ch.id)) n.delete(ch.id); else n.add(ch.id); return n; })}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-surface-2"
            >
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm font-extrabold", done === ch.lessons.length ? "bg-mint text-white" : "bg-brand-soft text-brand")}>
                {done === ch.lessons.length ? <Check className="h-4 w-4" strokeWidth={3} /> : ci + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold">{ch.title}</span>
                <span className="text-xs font-semibold text-muted">{done}/{ch.lessons.length} terminées</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted transition", isClosed && "-rotate-90")} />
            </button>
            {!isClosed && (
              <ul className="ml-[1.35rem] mt-1 space-y-0.5 border-l-2 border-line pl-3">
                {ch.lessons.map((l) => {
                  const active = l.id === params.lessonId;
                  const Icon = ICON[l.type];
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/learn/${course.slug}/${l.id}`}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition",
                          active ? "bg-brand text-on-brand shadow-[0_3px_0_var(--chunk)]" : "text-ink-soft hover:bg-surface-2",
                        )}
                      >
                        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", l.done ? (active ? "bg-white/25" : "bg-mint text-white") : "")}>
                          {l.done ? <Check className="h-3 w-3" strokeWidth={3.5} /> : <Icon className={cn("h-4 w-4", active ? "" : l.type === "QUIZ" ? "text-pink" : "text-muted")} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{l.title}</span>
                        <span className={cn("text-[11px] font-bold", active ? "text-white/80" : "text-muted")}>{l.durationMinutes}′</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      {hasExam && (
        <Link
          href={`/learn/${course.slug}/exam`}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mt-3 flex items-center gap-3 rounded-2xl border-2 border-dashed p-3 transition",
            onExam ? "border-sun bg-sun/15" : "border-sun/50 hover:bg-sun/10",
          )}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sun text-[#4a2f00]">{progress < 100 ? <Lock className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}</span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold">Examen final</span>
            <span className="text-xs font-semibold text-muted">{examPassed ? "Réussi ✅" : progress < 100 ? "Termine toutes les leçons" : "Disponible !"}</span>
          </span>
        </Link>
      )}
      {certificateCode && (
        <Link href={`/certificates/${certificateCode}`} className="mt-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#ffc93d] to-[#ff9f1c] p-3 text-[#3d2600]">
          <span className="text-2xl">🎓</span>
          <span className="text-sm font-extrabold">Voir mon certificat</span>
        </Link>
      )}
    </div>
  );

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <Link href={`/courses/${course.slug}`} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Retour au cours">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Link href="/dashboard" className="hidden sm:block" aria-label="Tableau de bord">
          <LogoMark size={32} />
        </Link>
        <button onClick={() => setSidebar(!sidebar)} className="hidden h-10 w-10 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:grid" aria-label="Basculer le programme">
          {sidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </button>
        <p className="min-w-0 flex-1 truncate font-display text-base font-extrabold sm:text-lg">{course.title}</p>
        <div className="hidden items-center gap-3 rounded-2xl bg-surface-2 px-3 py-1.5 text-sm font-extrabold sm:flex">
          <span className="text-coral">🔥 {user.streak}</span>
          <span className="text-[#b57d00] dark:text-sun">⚡ {user.xp}</span>
        </div>
        <ThemeToggle />
        <button onClick={() => setMobileOpen(true)} className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-surface-2 lg:pointer-events-none" aria-label="Programme du cours">
          <ProgressRing value={progress} size={40} stroke={5} color={progress === 100 ? "var(--color-mint)" : "var(--brand)"}>
            <span className="text-[10px] font-extrabold">{progress}%</span>
          </ProgressRing>
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className={cn("hidden w-[340px] shrink-0 overflow-y-auto border-r border-line bg-surface", sidebar && "lg:block")}>
          <p className="px-5 pt-5 text-xs font-extrabold uppercase tracking-wider text-muted">Programme</p>
          {list}
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto" id="learn-main">
          {children}
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[88vw] max-w-sm overflow-y-auto bg-surface shadow-2xl">
            <div className="flex items-center justify-between p-4">
              <p className="font-display text-lg font-extrabold">Programme · {progress} %</p>
              <button onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            {list}
          </div>
        </div>
      )}
    </div>
  );
}
