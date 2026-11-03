import "server-only";
import { db } from "./db";
import { levelFromXp, XP } from "./gamification";
import type { BadgeSlug } from "./badges";

export type Reward = {
  xp: number;
  levelUp: number | null;
  badges: { name: string; emoji: string; description: string }[];
  streak: number;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Ajoute de l'XP, met à jour la série de jours et débloque les badges mérités. */
export async function awardXp(
  userId: string,
  amount: number,
  type: string,
  label: string,
  minutes = 0,
): Promise<Reward> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();
  const today = dayKey(now);
  const last = user.lastActiveDate ? dayKey(user.lastActiveDate) : null;
  const yesterday = dayKey(new Date(now.getTime() - 86400000));

  let streak = user.streak;
  if (last !== today) streak = last === yesterday ? user.streak + 1 : 1;

  // Bonus objectif quotidien : on compare les minutes du jour avant/après.
  const startOfDay = new Date(today + "T00:00:00.000Z");
  const todayMinutes = await db.activity.aggregate({
    where: { userId, createdAt: { gte: startOfDay } },
    _sum: { minutes: true },
  });
  const before = todayMinutes._sum.minutes ?? 0;
  const goalReached = minutes > 0 && before < user.dailyGoalMinutes && before + minutes >= user.dailyGoalMinutes;

  let total = amount + (goalReached ? XP.DAILY_GOAL : 0);

  await db.activity.create({ data: { userId, type, label, xp: amount, minutes } });
  if (goalReached) {
    await db.activity.create({ data: { userId, type: "goal", label: "Objectif quotidien atteint 🎯", xp: XP.DAILY_GOAL } });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: total },
      streak,
      bestStreak: Math.max(user.bestStreak, streak),
      lastActiveDate: now,
    },
  });

  const badges = await checkBadges(userId, { hour: now.getHours(), type });
  const badgeXp = badges.reduce((s, b) => s + b.xpReward, 0);
  let finalXp = updated.xp;
  if (badgeXp) {
    finalXp = (await db.user.update({ where: { id: userId }, data: { xp: { increment: badgeXp } } })).xp;
    total += badgeXp;
  }

  const oldLevel = levelFromXp(user.xp);
  const newLevel = levelFromXp(finalXp);
  if (newLevel > oldLevel) {
    await db.notification.create({
      data: { userId, title: `Niveau ${newLevel} atteint !`, body: "Ta persévérance paie. Continue comme ça !", emoji: "🆙", href: "/dashboard" },
    });
    // Les badges de niveau peuvent dépendre du nouveau total.
    badges.push(...(await checkBadges(userId, { hour: now.getHours(), type: "level" })));
  }

  return {
    xp: total,
    levelUp: newLevel > oldLevel ? newLevel : null,
    badges: badges.map((b) => ({ name: b.name, emoji: b.emoji, description: b.description })),
    streak,
  };
}

async function checkBadges(userId: string, ctx: { hour: number; type: string }) {
  const [user, owned] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.userBadge.findMany({ where: { userId }, select: { badge: { select: { slug: true } } } }),
  ]);
  const has = new Set(owned.map((o) => o.badge.slug));
  const earn = new Set<BadgeSlug>();
  const want = (slug: BadgeSlug, cond: boolean | (() => Promise<boolean>)) => ({ slug, cond });

  const rules = [
    want("first-step", async () => (await db.lessonProgress.count({ where: { userId, completed: true } })) >= 1),
    want("enrolled", async () => (await db.enrollment.count({ where: { userId } })) >= 1),
    want("collector", async () => (await db.enrollment.count({ where: { userId } })) >= 5),
    want("streak-3", user.streak >= 3),
    want("streak-7", user.streak >= 7),
    want("streak-30", user.streak >= 30),
    want("quiz-ace", async () => (await db.quizAttempt.count({ where: { userId, score: 100 } })) >= 1),
    want("quiz-10", async () => (await db.quizAttempt.count({ where: { userId, passed: true } })) >= 10),
    want("finisher", async () => (await db.enrollment.count({ where: { userId, completedAt: { not: null } } })) >= 1),
    want("certified", async () => (await db.certificate.count({ where: { userId } })) >= 1),
    want("triple-cert", async () => (await db.certificate.count({ where: { userId } })) >= 3),
    want("night-owl", ctx.type === "lesson" && (ctx.hour >= 22 || ctx.hour < 5)),
    want("early-bird", ctx.type === "lesson" && ctx.hour >= 5 && ctx.hour < 8),
    want("critic", async () => (await db.review.count({ where: { userId } })) >= 1),
    want("note-taker", async () => (await db.note.count({ where: { userId } })) >= 10),
    want("level-5", levelFromXp(user.xp) >= 5),
    want("level-10", levelFromXp(user.xp) >= 10),
    want("xp-1000", user.xp >= 1000),
  ];

  for (const r of rules) {
    if (has.has(r.slug)) continue;
    const ok = typeof r.cond === "function" ? await r.cond() : r.cond;
    if (ok) earn.add(r.slug);
  }
  if (!earn.size) return [];

  const badges = await db.badge.findMany({ where: { slug: { in: [...earn] } } });
  await db.userBadge.createMany({ data: badges.map((b) => ({ userId, badgeId: b.id })), skipDuplicates: true });
  await db.notification.createMany({
    data: badges.map((b) => ({
      userId,
      title: `Badge débloqué : ${b.name}`,
      body: b.description,
      emoji: b.emoji,
      href: "/badges",
    })),
  });
  return badges;
}

/** Recalcule le pourcentage de progression d'une inscription. */
export async function refreshEnrollment(userId: string, courseId: string) {
  const [total, done] = await Promise.all([
    db.lesson.count({ where: { chapter: { courseId } } }),
    db.lessonProgress.count({ where: { userId, completed: true, lesson: { chapter: { courseId } } } }),
  ]);
  const progress = total ? Math.round((done / total) * 100) : 0;
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!enrollment) return { progress, justCompleted: false };
  const justCompleted = progress === 100 && !enrollment.completedAt;
  await db.enrollment.update({
    where: { id: enrollment.id },
    data: { progress, lastAccessAt: new Date(), ...(justCompleted ? { completedAt: new Date() } : {}) },
  });
  return { progress, justCompleted };
}

export function certificateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `LRN-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** Délivre le certificat si le cours est terminé et l'examen final réussi. */
export async function maybeIssueCertificate(userId: string, courseId: string) {
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId }, include: { quizzes: { where: { isFinal: true } } } });
  if (!course.certified) return null;
  const existing = await db.certificate.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (existing) return existing;
  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  if (!enrollment || enrollment.progress < 100) return null;

  let score = 100;
  const finalQuiz = course.quizzes[0];
  if (finalQuiz) {
    const best = await db.quizAttempt.findFirst({ where: { userId, quizId: finalQuiz.id, passed: true }, orderBy: { score: "desc" } });
    if (!best) return null;
    score = best.score;
  }

  const cert = await db.certificate.create({ data: { userId, courseId, score, code: certificateCode() } });
  await db.notification.create({
    data: { userId, title: "Certificat obtenu ! 🎓", body: `Félicitations, tu es certifié·e en « ${course.title} ».`, emoji: "🎓", href: `/certificates/${cert.code}` },
  });
  return cert;
}
