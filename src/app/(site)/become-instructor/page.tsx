import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clapperboard, Clock, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { ApplicationForm } from "@/components/profile/application-form";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Devenir formateur" };

const BENEFITS = [
  { icon: Clapperboard, title: "Un studio complet", text: "Chapitres, leçons vidéo, articles, quiz et examen final : tout se construit depuis votre navigateur." },
  { icon: Users, title: "Une audience engagée", text: "Des apprenants qui reviennent chaque jour grâce au suivi de progression." },
  { icon: Wallet, title: "Des revenus", text: "Fixez votre prix en FCFA et suivez vos ventes et vos avis en temps réel." },
  { icon: BadgeCheck, title: "Le badge certifié", text: "Un gage de qualité affiché sur toutes vos formations." },
];

export default async function BecomeInstructorPage() {
  const user = await requireUser("/become-instructor");
  const application = await db.instructorApplication.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <Container className="py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink">Programme formateurs</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight">Transmettez votre expertise à des milliers d'apprenants.</h1>
          <p className="mt-5 text-lg text-muted">
            Notre studio vous permet de créer des formations vidéo, des leçons écrites et des quiz. Chaque formateur est vérifié par l'équipe Learn et reçoit le badge « Formateur certifié ».
          </p>
          <div className="mt-8 space-y-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
                  <b.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-muted">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {user.role !== "STUDENT" ? (
            <div className="card p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <BadgeCheck className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Vous êtes déjà formateur</h2>
              <Link href="/studio" className={buttonClass("primary", "lg", "mt-6")}>
                Ouvrir le studio
              </Link>
            </div>
          ) : application?.status === "PENDING" ? (
            <div className="card p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <Clock className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Candidature en cours d'examen</h2>
              <p className="mt-2 text-muted">Envoyée le {formatDate(application.createdAt)}. Vous recevrez une notification dès qu'elle aura été traitée.</p>
            </div>
          ) : (
            <>
              {application?.status === "REJECTED" && (
                <div className="mb-4 rounded-xl bg-coral/10 p-4 text-sm text-coral">
                  Votre précédente candidature n'a pas été retenue{application.adminNote ? ` : ${application.adminNote}` : ""}. Vous pouvez en soumettre une nouvelle.
                </div>
              )}
              <ApplicationForm />
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
