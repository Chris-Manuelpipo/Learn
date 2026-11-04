import { ShieldCheck } from "lucide-react";
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
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-night text-white"><ShieldCheck className="h-5 w-5" /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">Administration</p>
          <h1 className="text-2xl font-bold">Centre de contrôle</h1>
        </div>
      </div>
      <AdminNav badges={{ applications: apps, courses: pending }} />
      <div className="mt-8">{children}</div>
    </Container>
  );
}
