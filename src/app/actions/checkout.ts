"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { convert, isCurrency } from "@/lib/currency";
import { enrollUser } from "@/lib/enroll";
import type { PaymentMethod } from "@prisma/client";
import type { Reward } from "@/lib/progression";

const METHODS: PaymentMethod[] = ["CARD", "ORANGE_MONEY", "MTN_MOMO", "PAYPAL"];

export async function processPayment(input: {
  courseId: string;
  method: string;
  currency: string;
  details: Record<string, string>;
}): Promise<{ error?: string; reference?: string; reward?: Reward | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };
  const course = await db.course.findUnique({ where: { id: input.courseId } });
  if (!course || course.status !== "PUBLISHED") return { error: "Cours introuvable." };
  if (!METHODS.includes(input.method as PaymentMethod)) return { error: "Moyen de paiement invalide." };
  const currency = isCurrency(input.currency) ? input.currency : "XAF";

  const already = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (already) return { error: "Tu es déjà inscrit à ce cours." };

  // Validation simulée des coordonnées.
  const d = input.details;
  if (input.method === "CARD") {
    const num = (d.number ?? "").replace(/\s/g, "");
    if (!/^\d{16}$/.test(num)) return { error: "Le numéro de carte doit contenir 16 chiffres." };
    if (!/^\d{2}\/\d{2}$/.test(d.expiry ?? "")) return { error: "Date d'expiration invalide (MM/AA)." };
    if (!/^\d{3}$/.test(d.cvc ?? "")) return { error: "Le CVC doit contenir 3 chiffres." };
    if (num.endsWith("0002")) return { error: "Paiement refusé par la banque (carte de test refusée)." };
  }
  if (input.method === "ORANGE_MONEY" || input.method === "MTN_MOMO") {
    if (!/^6\d{8}$/.test((d.phone ?? "").replace(/\s/g, ""))) return { error: "Numéro invalide : 9 chiffres commençant par 6." };
  }
  if (input.method === "PAYPAL" && !/^\S+@\S+\.\S+$/.test(d.email ?? "")) return { error: "Adresse PayPal invalide." };

  await new Promise((r) => setTimeout(r, 1200));

  const amount = currency === "XAF" ? course.price : Math.round(convert(course.price, currency) * 100);
  const reference = `PAY-${randomUUID().slice(0, 8).toUpperCase()}`;
  await db.payment.create({
    data: { reference, userId: user.id, courseId: course.id, amount, currency, amountXaf: course.price, method: input.method as PaymentMethod, status: "SUCCEEDED" },
  });
  const reward = await enrollUser(user.id, course.id, course.title);
  await db.notification.create({
    data: { userId: user.id, title: "Paiement confirmé ✅", body: `Tu as maintenant accès à « ${course.title} ». Bon apprentissage !`, emoji: "🧾", href: `/learn/${course.slug}` },
  });
  return { reference, reward };
}
