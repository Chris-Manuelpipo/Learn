"use server";

import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isCurrency } from "@/lib/currency";
import { PALETTE_COOKIE, isPaletteName } from "@/lib/palettes";
import { cookies } from "next/headers";
import type { FormState } from "./auth";

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(60),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._]{3,30}$/, "Nom d'utilisateur : 3 à 30 caractères (lettres, chiffres, . et _)"),
  headline: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(600).optional(),
  country: z.string().trim().max(40).optional(),
  website: z.string().trim().max(120).optional(),
  avatarEmoji: z.string().max(8),
  avatarColor: z.string().max(12),
});

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const taken = await db.user.findFirst({ where: { username: parsed.data.username, id: { not: user.id } } });
  if (taken) return { error: "Ce nom d'utilisateur est déjà pris." };

  let avatarUrl: string | null | undefined = undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return { error: "Image PNG, JPG ou WebP uniquement." };
    if (file.size > 2 * 1024 * 1024) return { error: "Image trop lourde (2 Mo max)." };
    const dir = path.join(process.cwd(), "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${user.id}-${Date.now()}.${file.type.split("/")[1]}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    avatarUrl = `/api/uploads/${name}`;
  }
  if (formData.get("removeAvatar") === "1") avatarUrl = null;

  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, ...(avatarUrl !== undefined ? { avatarUrl } : {}) } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil mis à jour ✨" };
}

export async function updatePreferences(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const goal = Number(formData.get("dailyGoalMinutes"));
  const currency = String(formData.get("currency"));
  if (![5, 10, 15, 20, 30, 45, 60].includes(goal)) return { error: "Objectif invalide." };
  if (!isCurrency(currency)) return { error: "Devise invalide." };
  await db.user.update({ where: { id: user.id }, data: { dailyGoalMinutes: goal, currency } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Préférences enregistrées 🎯" };
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Mot de passe actuel incorrect." };
  if (next.length < 8 || !/\d/.test(next)) return { error: "Nouveau mot de passe : 8 caractères minimum dont un chiffre." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true, message: "Mot de passe modifié 🔒" };
}

export async function applyInstructor(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée." };
  const data = {
    expertise: String(formData.get("expertise") ?? "").trim(),
    experience: String(formData.get("experience") ?? "").trim(),
    motivation: String(formData.get("motivation") ?? "").trim(),
    portfolio: String(formData.get("portfolio") ?? "").trim() || null,
  };
  if (data.expertise.length < 3) return { error: "Indique ton domaine d'expertise." };
  if (data.experience.length < 20) return { error: "Décris ton expérience (20 caractères minimum)." };
  if (data.motivation.length < 50) return { error: "Parle-nous de ta motivation (50 caractères minimum)." };
  const pending = await db.instructorApplication.findFirst({ where: { userId: user.id, status: "PENDING" } });
  if (pending) return { error: "Tu as déjà une candidature en cours d'examen." };
  await db.instructorApplication.create({ data: { userId: user.id, ...data } });
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await db.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title: "Nouvelle candidature formateur", body: `${user.name} souhaite devenir formateur (${data.expertise}).`, emoji: "🧑‍🏫", href: "/admin/applications" })),
  });
  revalidatePath("/become-instructor");
  return { ok: true, message: "Candidature envoyée ! Notre équipe te répond sous 48 h." };
}

export async function setAccentColor(name: string) {
  if (!isPaletteName(name)) return { error: "Couleur inconnue." };
  (await cookies()).set(PALETTE_COOKIE, name, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const user = await getCurrentUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { accentColor: name } });
  revalidatePath("/", "layout");
  return { ok: true };
}
