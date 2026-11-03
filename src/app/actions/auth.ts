"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export type FormState = { error?: string; fields?: Record<string, string>; ok?: boolean; message?: string } | undefined;

const safeNext = (n: FormDataEntryValue | null) => {
  const s = typeof n === "string" ? n : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Ton nom doit contenir au moins 2 caractères").max(60),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(8, "Au moins 8 caractères").regex(/\d/, "Ajoute au moins un chiffre"),
  avatarEmoji: z.string().max(8).optional(),
  dailyGoalMinutes: z.coerce.number().int().min(5).max(120).optional(),
});

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, avatarEmoji, dailyGoalMinutes } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) return { error: "Un compte existe déjà avec cet email." };

  let username = slugify(name).replace(/-/g, ".") || "apprenant";
  if (await db.user.findUnique({ where: { username } })) username = `${username}.${Math.floor(Math.random() * 9000 + 1000)}`;

  const colors = ["violet", "coral", "mint", "sky", "sun", "pink"];
  const user = await db.user.create({
    data: {
      name,
      email,
      username,
      passwordHash: await bcrypt.hash(password, 10),
      avatarEmoji: avatarEmoji || "🦊",
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      dailyGoalMinutes: dailyGoalMinutes ?? 15,
    },
  });
  await db.notification.create({
    data: { userId: user.id, title: `Bienvenue sur Learn, ${name.split(" ")[0]} ! 👋`, body: "Choisis ton premier cours et commence ta série dès aujourd'hui.", emoji: "🎉", href: "/courses" },
  });
  await createSession(user);
  redirect(safeNext(formData.get("next")) === "/dashboard" ? "/dashboard?welcome=1" : safeNext(formData.get("next")));
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email ou mot de passe incorrect.", fields: { email } };
  }
  await createSession(user);
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
