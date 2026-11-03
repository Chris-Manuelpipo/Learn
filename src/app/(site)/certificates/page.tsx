import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty";
import { buttonClass } from "@/components/ui/button";
import { CourseCover } from "@/components/course/course-cover";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes certificats" };

export default async function CertificatesPage() {
  const user = await requireUser("/certificates");
  const [certs, almost] = await Promise.all([
    db.certificate.findMany({ where: { userId: user.id }, orderBy: { issuedAt: "desc" }, include: { course: true } }),
    db.enrollment.findMany({ where: { userId: user.id, progress: { gte: 50, lt: 100 }, course: { certified: true } }, include: { course: true }, orderBy: { progress: "desc" }, take: 3 }),
  ]);

  return (
    <Container className="py-10">
      <PageHeader emoji="🎓" title="Mes certificats" text={`${certs.length} certificat${certs.length > 1 ? "s" : ""} obtenu${certs.length > 1 ? "s" : ""}, tous vérifiables en ligne.`} />
      {certs.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <Link key={c.id} href={`/certificates/${c.code}`} className="group card overflow-hidden p-2.5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
              <div className="relative">
                <CourseCover course={c.course} className="aspect-[16/9] rounded-[1.25rem]" />
                <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-extrabold text-[#16122b]">🎓 Score {c.score} %</span>
              </div>
              <div className="p-4">
                <p className="font-extrabold leading-snug">{c.course.title}</p>
                <p className="mt-1 text-sm text-muted">Délivré le {formatDate(c.issuedAt)}</p>
                <p className="mt-3 font-mono text-xs font-bold text-brand">{c.code}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🎓"
          title="Ton premier certificat t'attend"
          text="Termine un cours certifiant et réussis l'examen final pour obtenir un certificat vérifiable."
          action={<Link href="/courses?certified=1" className={buttonClass("primary", "lg")}>Voir les cours certifiants</Link>}
        />
      )}
      {almost.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-extrabold">Presque certifié 🔥</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {almost.map((e) => (
              <Link key={e.id} href={`/learn/${e.course.slug}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
                <CourseCover course={e.course} size="sm" className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{e.course.title}</p>
                  <ProgressBar value={e.progress} className="mt-2" height={8} />
                  <p className="mt-1 text-xs font-bold text-muted">{e.progress} % · plus que {100 - e.progress} % !</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
