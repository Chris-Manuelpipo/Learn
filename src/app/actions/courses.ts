"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardXp, type Reward } from "@/lib/progression";
import { XP } from "@/lib/gamification";
import { isCurrency } from "@/lib/currency";
import { CURRENCY_COOKIE } from "@/lib/currency-server";
import { enrollUser } from "@/lib/enroll";

export async function toggleFavorite(courseId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Connecte-toi pour ajouter des favoris.", favorite: false };
  const key = { userId_courseId: { userId: user.id, courseId } };
  const existing = await db.favorite.findUnique({ where: key });
  if (existing) await db.favorite.delete({ where: key });
  else await db.favorite.create({ data: { userId: user.id, courseId } });
  revalidatePath("/my-courses");
  return { favorite: !existing };
}

export async function enrollFree(courseId: string) {
  const user = await getCurrentUser();
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId } });
  if (!user) redirect(`/login?next=/courses/${course.slug}`);
  if (course.price > 0) redirect(`/checkout/${course.slug}`);
  await enrollUser(user.id, course.id, course.title);
  redirect(`/learn/${course.slug}`);
}


export async function submitReview(courseId: string, rating: number, comment: string): Promise<{ error?: string; reward?: Reward }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Connecte-toi pour laisser un avis." };
  if (rating < 1 || rating > 5) return { error: "Choisis une note entre 1 et 5." };
  if (comment.trim().length < 10) return { error: "Ton avis doit faire au moins 10 caractères." };
  const enrolled = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
  if (!enrolled) return { error: "Inscris-toi au cours pour pouvoir le noter." };

  const key = { userId_courseId: { userId: user.id, courseId } };
  const existing = await db.review.findUnique({ where: key });
  await db.review.upsert({ where: key, create: { userId: user.id, courseId, rating, comment: comment.trim() }, update: { rating, comment: comment.trim() } });
  const agg = await db.review.aggregate({ where: { courseId }, _avg: { rating: true }, _count: true });
  const course = await db.course.update({
    where: { id: courseId },
    data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
  });
  const reward = existing ? undefined : await awardXp(user.id, XP.REVIEW, "review", `Avis sur ${course.title}`);
  revalidatePath(`/courses/${course.slug}`);
  return { reward };
}

export async function setCurrency(currency: string) {
  if (!isCurrency(currency)) return;
  (await cookies()).set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { currency } });
  revalidatePath("/", "layout");
}

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/", "layout");
}
