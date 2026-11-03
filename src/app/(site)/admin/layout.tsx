import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/section";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN"]);
  const [apps, pending] = await Promise.all([db.instructorApplication.count({ where: { status: "PENDING" } }), db.course.count({ where: { status: "PENDING" } })]);
  return (
    <Container className="py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-night text-2xl">🛰️</span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral">Administration</p>
          <h1 className="text-2xl font-extrabold">Centre de contrôle</h1>
        </div>
      </div>
      <AdminNav badges={{ applications: apps, courses: pending }} />
      <div className="mt-8">{children}</div>
    </Container>
  );
}
