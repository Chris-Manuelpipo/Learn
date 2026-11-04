import type { Metadata } from "next";
import { BookOpen, GraduationCap, Users, Wallet, type LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/currency";
import { formatNumber, cn } from "@/lib/utils";
import { dayKey } from "@/lib/stats";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { CourseCover } from "@/components/course/course-cover";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 29);
  const [users, students, instructors, courses, enrollments, certs, revenue, payments, signups, methods, topCourses] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "INSTRUCTOR" } }),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.enrollment.count(),
    db.certificate.count(),
    db.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountXaf: true } }),
    db.payment.findMany({ where: { createdAt: { gte: since }, status: "SUCCEEDED" }, select: { amountXaf: true, createdAt: true } }),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.payment.groupBy({ by: ["method"], _count: true, _sum: { amountXaf: true } }),
    db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: { studentsCount: "desc" }, take: 5, select: { slug: true, title: true, color: true, coverUrl: true, studentsCount: true, ratingAvg: true } }),
  ]);

  const byDay = new Map<string, number>();
  for (const p of payments) byDay.set(dayKey(p.createdAt), (byDay.get(dayKey(p.createdAt)) ?? 0) + p.amountXaf);
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return { date: dayKey(d), value: byDay.get(dayKey(d)) ?? 0 };
  });
  const totalMethods = methods.reduce((s, m) => s + m._count, 0);
  const METHOD = { CARD: ["Carte", "var(--brand)"], ORANGE_MONEY: ["Orange Money", "#ff7900"], MTN_MOMO: ["MTN MoMo", "#ffcc00"], PAYPAL: ["PayPal", "#003087"] } as const;

  const kpis: [LucideIcon, string, string, string][] = [
    [Users, "Utilisateurs", formatNumber(users), `${students} étudiants · ${instructors} formateurs`],
    [BookOpen, "Formations publiées", formatNumber(courses), `${formatNumber(enrollments)} inscriptions`],
    [Wallet, "Revenus totaux", formatPrice(revenue._sum.amountXaf ?? 0, "XAF"), `${formatPrice(payments.reduce((s, p) => s + p.amountXaf, 0), "XAF")} sur 30 jours`],
    [GraduationCap, "Certificats", formatNumber(certs), `${signups} nouveaux inscrits sur 30 jours`],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([StatIcon, l, v, sub]) => (
          <div key={l} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-ink">
              <StatIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-3xl font-bold tracking-tight">{v}</p>
            <p className="text-sm font-medium text-muted">{l}</p>
            <p className="mt-1 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card p-6">
          <h2 className="text-lg font-bold">Revenus des 30 derniers jours</h2>
          <p className="text-sm text-muted">Paiements réussis, en FCFA</p>
          <RevenueChart data={series} />
        </section>
        <section className="card p-6">
          <h2 className="mb-5 text-lg font-bold">Moyens de paiement</h2>
          <div className="mb-6 flex h-4 overflow-hidden rounded-full">
            {methods.map((m) => (
              <div key={m.method} style={{ width: `${(m._count / totalMethods) * 100}%`, background: METHOD[m.method][1] }} title={METHOD[m.method][0]} />
            ))}
          </div>
          <ul className="space-y-3">
            {methods.sort((a, b) => b._count - a._count).map((m) => (
              <li key={m.method} className="flex items-center gap-3 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: METHOD[m.method][1] }} />
                <span className="flex-1 font-bold">{METHOD[m.method][0]}</span>
                <span className="text-muted">{m._count} · {Math.round((m._count / totalMethods) * 100)} %</span>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-8 text-lg font-bold">Top cours</h2>
          <ol className="space-y-2">
            {topCourses.map((c, i) => (
              <li key={c.title} className={cn("flex items-center gap-3 rounded-xl p-2 text-sm", i === 0 && "bg-sun/15")}>
                <CourseCover course={c} size="sm" className="h-8 w-12 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1 truncate font-bold">{c.title}</span>
                <span className="font-bold text-brand">{c.studentsCount}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
