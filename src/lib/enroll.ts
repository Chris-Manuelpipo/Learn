import "server-only";
import { db } from "./db";
import { awardXp } from "./progression";
import { XP } from "./gamification";

export async function enrollUser(userId: string, courseId: string, title: string) {
  const exists = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (exists) return null;
  await db.enrollment.create({ data: { userId, courseId } });
  await db.course.update({ where: { id: courseId }, data: { studentsCount: { increment: 1 } } });
  return awardXp(userId, XP.ENROLL, "enroll", `Inscription : ${title}`);
}
