"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { CourseStatus, Role } from "@prisma/client";

async function admin() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");
  return user;
}

export async function reviewApplication(id: string, approve: boolean, note?: string) {
  await admin();
  const app = await db.instructorApplication.update({
    where: { id },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewedAt: new Date(), adminNote: note?.trim() || null },
  });
  if (approve) {
    await db.user.update({ where: { id: app.userId }, data: { role: "INSTRUCTOR", instructorVerified: true, expertise: app.expertise } });
  }
  await db.notification.create({
    data: approve
      ? { userId: app.userId, title: "Candidature acceptée", body: "Vous êtes désormais formateur certifié. Ouvrez le studio pour créer votre première formation.", icon: "user-check", href: "/studio" }
      : { userId: app.userId, title: "Candidature formateur", body: note?.trim() || "Votre candidature n'a pas été retenue. Vous pouvez en soumettre une nouvelle.", icon: "inbox", href: "/become-instructor" },
  });
  revalidatePath("/admin", "layout");
}

export async function setUserRole(userId: string, role: Role) {
  const me = await admin();
  if (userId === me.id) return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  await db.user.update({ where: { id: userId }, data: { role, ...(role === "STUDENT" ? { instructorVerified: false } : {}) } });
  revalidatePath("/admin/users");
}

export async function toggleVerified(userId: string) {
  await admin();
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await db.user.update({ where: { id: userId }, data: { instructorVerified: !u.instructorVerified } });
  if (!u.instructorVerified) {
    await db.notification.create({ data: { userId, title: "Formateur certifié", body: "Le badge apparaît désormais sur toutes vos formations.", icon: "user-check", href: "/studio" } });
  }
  revalidatePath("/admin/users");
}

export async function setCourseStatus(courseId: string, status: CourseStatus) {
  await admin();
  const course = await db.course.update({ where: { id: courseId }, data: { status, ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}) } });
  if (status === "PUBLISHED" || status === "DRAFT") {
    await db.notification.create({
      data: {
        userId: course.instructorId,
        title: status === "PUBLISHED" ? "Votre formation est en ligne" : "Votre formation nécessite des modifications",
        body: `« ${course.title} » ${status === "PUBLISHED" ? "a été validé et publié." : "a été repassé en brouillon par l'équipe."}`,
        icon: status === "PUBLISHED" ? "rocket" : "pencil",
        href: `/studio/courses/${course.id}`,
      },
    });
  }
  revalidatePath("/admin/courses");
}

export async function toggleFeatured(courseId: string) {
  await admin();
  const c = await db.course.findUniqueOrThrow({ where: { id: courseId } });
  await db.course.update({ where: { id: courseId }, data: { featured: !c.featured } });
  revalidatePath("/admin/courses");
}
