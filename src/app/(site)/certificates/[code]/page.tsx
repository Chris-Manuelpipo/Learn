import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCertificate, qrSvg, verifyUrl } from "@/lib/certificate";
import { Container } from "@/components/ui/section";
import { buttonClass } from "@/components/ui/button";
import { CertificateCard } from "@/components/certificate/certificate-card";
import { CopyButton } from "@/components/certificate/copy-button";

export const metadata: Metadata = { title: "Certificat" };

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [cert, user] = await Promise.all([getCertificate(code), getCurrentUser()]);
  if (!cert) notFound();
  const mine = user?.id === cert.userId;
  const url = verifyUrl(code);
  const issued = new Date(cert.issuedAt);
  const linkedin = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course.title)}&organizationName=Learn&issueYear=${issued.getFullYear()}&issueMonth=${issued.getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${code}`;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-ink">
              <ShieldCheck className="h-4 w-4" /> Certificat authentique
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{mine ? "Félicitations" : `Certificat de ${cert.user.name}`}</h1>
            <p className="mt-1 text-muted">{cert.course.title}</p>
          </div>
        </div>
        <CertificateCard
          code={cert.code}
          name={cert.user.name}
          course={cert.course.title}
          category={cert.course.category.name}
          instructor={cert.course.instructor.name}
          durationMinutes={cert.course.durationMinutes}
          score={cert.score}
          issuedAt={cert.issuedAt}
          qr={await qrSvg(code)}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`/api/certificates/${code}/pdf`} className={buttonClass("primary", "lg")}>
            <Download className="h-5 w-5" /> Télécharger en PDF
          </a>
          {mine && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "lg")}>
              <span className="grid h-5 w-5 place-items-center rounded bg-[#0a66c2] text-[11px] font-black text-white">in</span> Ajouter à LinkedIn
            </a>
          )}
          <CopyButton text={url} />
          <Link href={`/verify/${code}`} className={buttonClass("ghost", "lg")}>
            <ExternalLink className="h-5 w-5" /> Page de vérification
          </Link>
        </div>
      </div>
    </Container>
  );
}
