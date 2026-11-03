import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty";
import { ApplicationActions } from "@/components/admin/admin-actions";
import { formatDate, cn } from "@/lib/utils";

export default async function ApplicationsPage() {
  const apps = await db.instructorApplication.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], include: { user: true } });
  if (!apps.length) return <EmptyState emoji="📭" title="Aucune candidature" />;
  const STATUS = { PENDING: ["En attente", "bg-sun/20 text-[#9a6200] dark:text-sun"], APPROVED: ["Approuvée", "bg-mint/15 text-mint"], REJECTED: ["Refusée", "bg-coral/10 text-coral"] } as const;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {apps.map((a) => (
        <div key={a.id} className={cn("card p-6", a.status !== "PENDING" && "opacity-70")}>
          <div className="flex items-start gap-4">
            <Avatar user={a.user} size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-extrabold">{a.user.name}</p>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-extrabold", STATUS[a.status][1])}>{STATUS[a.status][0]}</span>
              </div>
              <p className="text-sm text-muted">{a.user.email} · {formatDate(a.createdAt)}</p>
              <p className="mt-2 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-extrabold text-brand">{a.expertise}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div><dt className="font-extrabold">Expérience</dt><dd className="text-ink-soft">{a.experience}</dd></div>
            <div><dt className="font-extrabold">Motivation</dt><dd className="text-ink-soft">{a.motivation}</dd></div>
            {a.portfolio && <div><dt className="font-extrabold">Portfolio</dt><dd><a href={a.portfolio} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{a.portfolio}</a></dd></div>}
            {a.adminNote && <div><dt className="font-extrabold">Note</dt><dd className="text-ink-soft">{a.adminNote}</dd></div>}
          </dl>
          {a.status === "PENDING" && <div className="mt-5 border-t border-line pt-5"><ApplicationActions id={a.id} /></div>}
        </div>
      ))}
    </div>
  );
}
