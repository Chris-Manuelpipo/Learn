import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { CourseInfoForm } from "@/components/studio/course-info-form";

export const metadata: Metadata = { title: "Nouveau cours" };

export default async function NewCoursePage() {
  await requireRole(["INSTRUCTOR", "ADMIN"]);
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <Container className="max-w-4xl py-10">
      <PageHeader emoji="✨" title="Nouveau cours" text="Les bases d'abord : tu ajouteras chapitres, leçons et quiz à l'étape suivante." />
      <CourseInfoForm categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))} />
    </Container>
  );
}
