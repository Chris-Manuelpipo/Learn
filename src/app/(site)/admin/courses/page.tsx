import Link from "next/link";
import type { CourseStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/currency";
import { formatNumber, cn } from "@/lib/utils";
import { CourseActions } from "@/components/admin/admin-actions";

const STATUSES = [
  [null, "Tous"],
  ["PENDING", "⏳ À valider"],
  ["PUBLISHED", "✅ Publiés"],
  ["DRAFT", "📝 Brouillons"],
] as const;

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const courses = await db.course.findMany({
    where: { ...(status ? { status: status as CourseStatus } : {}), ...(q ? { title: { contains: q, mode: "insensitive" } } : {}) },
    orderBy: [{ status: "asc" }, { studentsCount: "desc" }],
    take: 100,
    include: { instructor: { select: { name: true } }, category: { select: { name: true } } },
  });
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {STATUSES.map(([s, l]) => (
          <Link key={l} href={s ? `?status=${s}` : "?"} className={cn("rounded-xl px-3.5 py-2 text-sm font-extrabold", (status ?? null) === s ? "bg-brand text-on-brand" : "bg-surface ring-2 ring-line")}>
            {l}
          </Link>
        ))}
        <form className="ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Rechercher un cours…" className="h-10 rounded-xl border-2 border-line bg-surface px-3 text-sm outline-none focus:border-brand" />
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs font-extrabold uppercase tracking-wider text-muted">
            <tr>
              <th className="p-4">Cours</th>
              <th className="p-4">Formateur</th>
              <th className="p-4">Statut</th>
              <th className="p-4 text-right">Prix</th>
              <th className="p-4 text-right">Inscrits</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                <td className="p-4">
                  <Link href={`/courses/${c.slug}`} className="flex items-center gap-3 font-bold hover:text-brand">
                    <span className="text-2xl">{c.emoji}</span>
                    <span>
                      {c.title}
                      <span className="block text-xs font-semibold text-muted">{c.category.name}</span>
                    </span>
                  </Link>
                </td>
                <td className="p-4 text-muted">{c.instructor.name}</td>
                <td className="p-4">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-extrabold", c.status === "PUBLISHED" ? "bg-mint/15 text-mint" : c.status === "PENDING" ? "bg-sun/20 text-[#9a6200] dark:text-sun" : "bg-surface-2 text-muted")}>{c.status}</span>
                </td>
                <td className="p-4 text-right font-bold">{formatPrice(c.price, "XAF")}</td>
                <td className="p-4 text-right font-bold">{formatNumber(c.studentsCount)}</td>
                <td className="p-4"><CourseActions id={c.id} status={c.status} featured={c.featured} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
