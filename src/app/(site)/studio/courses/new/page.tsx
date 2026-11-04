import type { Metadata } from "next";
import { FilePlus2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { CourseInfoForm } from "@/components/studio/course-info-form";

export const metadata: Metadata = { title: "Nouvelle formation" };

export default async function NewCoursePage() {
  await requireRole(["INSTRUCTOR", "ADMIN"]);
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return (
    <Container className="max-w-4xl py-10">
      <PageHeader icon={FilePlus2} title="Nouvelle formation" text="Commencez par les informations générales : chapitres, leçons et quiz s'ajoutent à l'étape suivante." />
      <CourseInfoForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </Container>
  );
}
