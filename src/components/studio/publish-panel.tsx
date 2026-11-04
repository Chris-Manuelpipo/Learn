"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { deleteCourse, submitCourse, unpublishCourse } from "@/app/actions/studio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublishPanel({ courseId, status, lessons, certified, examQuestions, verified, students }: { courseId: string; status: string; lessons: number; certified: boolean; examQuestions: number; verified: boolean; students: number }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const checks = [
    { ok: lessons >= 3, label: "Au moins 3 leçons", detail: `${lessons} leçon(s)` },
    { ok: !certified || examQuestions >= 3, label: "Examen final (cours certifiant)", detail: certified ? `${examQuestions} question(s)` : "Non requis" },
  ];
  const ready = checks.every((c) => c.ok);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wider text-muted">Statut actuel</p>
        <p className="mt-1 text-3xl font-bold">
          {{ DRAFT: "Brouillon", PENDING: "En cours de validation", PUBLISHED: "Publiée", ARCHIVED: "Archivée" }[status]}
        </p>
        <ul className="mt-6 space-y-3">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-3">
              <span className={cn("grid h-6 w-6 place-items-center rounded-full text-white", c.ok ? "bg-brand" : "bg-coral")}>{c.ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}</span>
              <span className="flex-1 font-bold">{c.label}</span>
              <span className="text-sm text-muted">{c.detail}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {status !== "PUBLISHED" && status !== "PENDING" && (
            <Button
              size="lg"
              variant="primary"
              disabled={!ready}
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await submitCourse(courseId);
                  if (res.error) return void toast.error(res.error);
                  if (res.published) {
                    toast.success("Formation publiée");
                  } else toast.success("Formation envoyée pour validation");
                  router.refresh();
                })
              }
            >
              {verified ? "Publier la formation" : "Soumettre pour validation"}
            </Button>
          )}
          {(status === "PUBLISHED" || status === "PENDING") && (
            <Button size="lg" variant="secondary" loading={pending} onClick={() => start(async () => { await unpublishCourse(courseId); toast("Cours repassé en brouillon"); router.refresh(); })}>
              Repasser en brouillon
            </Button>
          )}
        </div>
        {!verified && <p className="mt-4 text-sm text-muted">Les formateurs certifiés publient directement. Les autres cours sont validés par l'équipe Learn sous 48 h.</p>}
      </div>
      {students === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-coral/40 p-6">
          <p className="font-bold text-coral">Zone de danger</p>
          <p className="mt-1 text-sm text-muted">Supprimer définitivement cette formation et tout son contenu.</p>
          <Button variant="danger" className="mt-4" loading={pending} onClick={() => confirm("Supprimer définitivement cette formation ?") && start(async () => { const r = await deleteCourse(courseId); if (r?.error) toast.error(r.error); })}>
            Supprimer la formation
          </Button>
        </div>
      )}
    </div>
  );
}
