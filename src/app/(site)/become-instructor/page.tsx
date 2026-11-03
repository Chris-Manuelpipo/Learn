import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { ApplicationForm } from "@/components/profile/application-form";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Devenir formateur" };

export default async function BecomeInstructorPage() {
  const user = await requireUser("/become-instructor");
  const application = await db.instructorApplication.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <Container className="py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand">Programme formateurs</p>
          <h1 className="mt-2 text-4xl font-extrabold sm:text-5xl">Partage ce que tu sais, inspire des milliers d'apprenants.</h1>
          <p className="mt-5 text-lg text-muted">Notre studio te permet de créer des cours vidéo, des leçons écrites et des quiz en quelques clics. Chaque formateur est vérifié par l'équipe Learn et reçoit le badge « Formateur certifié ».</p>
          <div className="mt-8 space-y-4">
            {[
              ["🎬", "Un studio simple", "Chapitres, leçons vidéo, articles et quiz : tout se construit en glisser-cliquer."],
              ["🧑‍🎓", "Une audience motivée", "Des apprenants gamifiés qui reviennent chaque jour."],
              ["💸", "Des revenus", "Fixe ton prix en FCFA ; suis tes ventes et tes avis en temps réel."],
              ["✅", "Le badge certifié", "Un gage de qualité visible sur tous tes cours."],
            ].map(([e, t, d]) => (
              <div key={t} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-2xl">{e}</span>
                <div>
                  <p className="font-extrabold">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          {user.role !== "STUDENT" ? (
            <div className="card p-8 text-center">
              <p className="text-6xl">🎉</p>
              <h2 className="mt-4 text-2xl font-extrabold">Tu es déjà formateur !</h2>
              <Link href="/studio" className={buttonClass("primary", "lg", "mt-6")}>Ouvrir le studio</Link>
            </div>
          ) : application?.status === "PENDING" ? (
            <div className="card p-8 text-center">
              <p className="text-6xl">⏳</p>
              <h2 className="mt-4 text-2xl font-extrabold">Candidature en cours d'examen</h2>
              <p className="mt-2 text-muted">Envoyée le {formatDate(application.createdAt)}. Tu recevras une notification dès qu'elle sera traitée.</p>
            </div>
          ) : (
            <>
              {application?.status === "REJECTED" && (
                <div className="mb-4 rounded-2xl bg-coral/10 p-4 text-sm font-semibold text-coral">
                  Ta précédente candidature n'a pas été retenue{application.adminNote ? ` : ${application.adminNote}` : ""}. Tu peux en soumettre une nouvelle.
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
