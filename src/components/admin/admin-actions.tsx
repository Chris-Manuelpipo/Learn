"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { reviewApplication, setCourseStatus, setUserRole, toggleFeatured, toggleVerified } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourseStatus, Role } from "@prisma/client";

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<unknown>, ok?: string) =>
    start(async () => {
      try {
        const r = (await fn()) as { error?: string } | undefined;
        if (r?.error) toast.error(r.error);
        else if (ok) toast.success(ok);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  return { pending, run };
}

export function ApplicationActions({ id }: { id: string }) {
  const { pending, run } = useRun();
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message au candidat (optionnel)" className="h-10 text-sm" />
      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={pending} onClick={() => run(() => reviewApplication(id, true, note), "Formateur approuvé et certifié")}>
          Approuver et certifier
        </Button>
        <Button variant="secondary" size="sm" loading={pending} onClick={() => run(() => reviewApplication(id, false, note), "Candidature refusée")}>
          Refuser
        </Button>
      </div>
    </div>
  );
}

export function CourseActions({ id, status, featured }: { id: string; status: CourseStatus; featured: boolean }) {
  const { pending, run } = useRun();
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {status !== "PUBLISHED" && (
        <Button size="sm" variant="mint" loading={pending} onClick={() => run(() => setCourseStatus(id, "PUBLISHED"), "Cours publié")}>
          Publier
        </Button>
      )}
      {status === "PUBLISHED" && (
        <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => setCourseStatus(id, "DRAFT"), "Cours dépublié")}>
          Dépublier
        </Button>
      )}
      {status === "PENDING" && (
        <Button size="sm" variant="ghost" loading={pending} onClick={() => run(() => setCourseStatus(id, "DRAFT"), "Renvoyé au formateur")}>
          Refuser
        </Button>
      )}
      <Button size="sm" variant={featured ? "soft" : "ghost"} loading={pending} onClick={() => run(() => toggleFeatured(id))} title={featured ? "Retirer de la sélection" : "Mettre en avant"}>
        <Star className={featured ? "h-4 w-4 fill-current" : "h-4 w-4"} />
      </Button>
    </div>
  );
}

export function UserActions({ id, role, verified }: { id: string; role: Role; verified: boolean }) {
  const { pending, run } = useRun();
  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={role}
        disabled={pending}
        onChange={(e) => run(() => setUserRole(id, e.target.value as Role), "Rôle mis à jour")}
        className="h-9 rounded-xl border border-line bg-surface px-2 text-sm font-bold"
        aria-label="Rôle"
      >
        <option value="STUDENT">Étudiant</option>
        <option value="INSTRUCTOR">Formateur</option>
        <option value="ADMIN">Admin</option>
      </select>
      {role !== "STUDENT" && (
        <Button size="sm" variant={verified ? "soft" : "ghost"} loading={pending} onClick={() => run(() => toggleVerified(id))} title="Formateur certifié">
          {verified ? "Certifié" : "Certifier"}
        </Button>
      )}
    </div>
  );
}
