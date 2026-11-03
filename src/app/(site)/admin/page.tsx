import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/currency";
import { formatNumber, cn } from "@/lib/utils";
import { dayKey } from "@/lib/stats";
import { RevenueChart } from "@/components/admin/revenue-chart";

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
    db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: { studentsCount: "desc" }, take: 5, select: { title: true, emoji: true, studentsCount: true, ratingAvg: true } }),
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["👥", "Utilisateurs", formatNumber(users), `${students} étudiants · ${instructors} formateurs`],
          ["📚", "Cours publiés", formatNumber(courses), `${formatNumber(enrollments)} inscriptions`],
          ["💰", "Revenus totaux", formatPrice(revenue._sum.amountXaf ?? 0, "XAF"), `${formatPrice(payments.reduce((s, p) => s + p.amountXaf, 0), "XAF")} sur 30 j`],
          ["🎓", "Certificats", formatNumber(certs), `+${signups} inscrits sur 30 j`],
        ].map(([e, l, v, s]) => (
          <div key={l} className="card p-5">
            <span className="text-3xl">{e}</span>
            <p className="mt-3 font-display text-3xl font-extrabold">{v}</p>
            <p className="text-sm font-bold text-muted">{l}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{s}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card p-6">
          <h2 className="text-lg font-extrabold">Revenus des 30 derniers jours</h2>
          <p className="text-sm text-muted">Paiements réussis, en FCFA</p>
          <RevenueChart data={series} />
        </section>
        <section className="card p-6">
          <h2 className="mb-5 text-lg font-extrabold">Moyens de paiement</h2>
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
          <h2 className="mb-3 mt-8 text-lg font-extrabold">Top cours</h2>
          <ol className="space-y-2">
            {topCourses.map((c, i) => (
              <li key={c.title} className={cn("flex items-center gap-3 rounded-xl p-2 text-sm", i === 0 && "bg-sun/15")}>
                <span className="text-xl">{c.emoji}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{c.title}</span>
                <span className="font-extrabold text-brand">{c.studentsCount}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
