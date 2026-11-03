import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, ShieldX } from "lucide-react";
import { getCertificate } from "@/lib/certificate";
import { Container } from "@/components/ui/section";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";
import { formatDate, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Vérification de certificat" };

export default async function VerifyCodePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await getCertificate(decodeURIComponent(code));

  if (!cert) {
    return (
      <Container className="py-20">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-coral/15 text-coral">
            <ShieldX className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold">Certificat introuvable</h1>
          <p className="mt-3 text-muted">
            Aucun certificat ne correspond à l'identifiant <span className="font-mono font-bold text-ink">{decodeURIComponent(code)}</span>. Vérifie la saisie.
          </p>
          <Link href="/verify" className={buttonClass("secondary", "lg", "mt-8")}>
            Réessayer
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="card mx-auto max-w-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#1fd1a0] to-[#14b8c4] p-8 text-center text-white">
          <ShieldCheck className="mx-auto h-14 w-14" />
          <h1 className="mt-3 text-3xl font-extrabold">Certificat valide</h1>
          <p className="mt-1 font-mono text-sm font-bold text-white/85">{cert.code}</p>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-4">
            <Avatar user={cert.user} size={64} />
            <div>
              <p className="text-sm font-bold text-muted">Délivré à</p>
              <Link href={`/u/${cert.user.username}`} className="text-2xl font-extrabold hover:text-brand">
                {cert.user.name}
              </Link>
            </div>
          </div>
          <dl className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              ["Cours", cert.course.title],
              ["Catégorie", cert.course.category.name],
              ["Formateur", cert.course.instructor.name],
              ["Durée de formation", formatDuration(cert.course.durationMinutes)],
              ["Score à l'examen final", `${cert.score} %`],
              ["Date de délivrance", formatDate(cert.issuedAt)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface-2 p-4">
                <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">{k}</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-extrabold">
                  {v}
                  {k === "Formateur" && cert.course.instructor.instructorVerified && <BadgeCheck className="h-4 w-4 text-sky" />}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/certificates/${cert.code}`} className={buttonClass("primary", "md")}>
              Voir le certificat
            </Link>
            <Link href={`/courses/${cert.course.slug}`} className={buttonClass("secondary", "md")}>
              Découvrir le cours
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
