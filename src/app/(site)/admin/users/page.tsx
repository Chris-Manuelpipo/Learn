import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { UserActions } from "@/components/admin/admin-actions";
import { levelInfo } from "@/lib/gamification";
import { formatDate, formatNumber, cn } from "@/lib/utils";

const ROLES = [
  [null, "Tous"],
  ["STUDENT", "Étudiants"],
  ["INSTRUCTOR", "Formateurs"],
  ["ADMIN", "Admins"],
] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  const { role, q } = await searchParams;
  const where: Prisma.UserWhereInput = {
    ...(role ? { role: role as Role } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({ where, orderBy: [{ role: "desc" }, { xp: "desc" }], take: 60, include: { _count: { select: { enrollments: true, certificates: true } } } }),
    db.user.count({ where }),
  ]);
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {ROLES.map(([r, l]) => (
          <Link key={l} href={r ? `?role=${r}` : "?"} className={cn("rounded-xl px-3.5 py-2 text-sm font-extrabold", (role ?? null) === r ? "bg-brand text-white" : "bg-surface ring-2 ring-line")}>
            {l}
          </Link>
        ))}
        <span className="text-sm font-bold text-muted">{formatNumber(total)} résultats</span>
        <form className="ml-auto">
          {role && <input type="hidden" name="role" value={role} />}
          <input name="q" defaultValue={q} placeholder="Nom ou email…" className="h-10 rounded-xl border-2 border-line bg-surface px-3 text-sm outline-none focus:border-brand" />
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs font-extrabold uppercase tracking-wider text-muted">
            <tr>
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Niveau</th>
              <th className="p-4 text-right">Cours</th>
              <th className="p-4 text-right">Certificats</th>
              <th className="p-4">Inscrit le</th>
              <th className="p-4 text-right">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
                <td className="p-4">
                  <Link href={`/u/${u.username}`} className="flex items-center gap-3 hover:text-brand">
                    <Avatar user={u} size={36} />
                    <span>
                      <span className="block font-bold">{u.name}</span>
                      <span className="block text-xs text-muted">{u.email}</span>
                    </span>
                  </Link>
                </td>
                <td className="p-4 font-bold">Niv. {levelInfo(u.xp).level} <span className="text-xs text-muted">· {formatNumber(u.xp)} XP</span></td>
                <td className="p-4 text-right font-bold">{u._count.enrollments}</td>
                <td className="p-4 text-right font-bold">{u._count.certificates}</td>
                <td className="p-4 text-muted">{formatDate(u.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="p-4"><UserActions id={u.id} role={u.role} verified={u.instructorVerified} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
