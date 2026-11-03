import "server-only";
import { db } from "./db";

export function startOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // lundi = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** XP et minutes par jour sur les N derniers jours. */
export async function dailyActivity(userId: string, days: number) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - days + 1);
  const rows = await db.activity.findMany({ where: { userId, createdAt: { gte: since } }, select: { xp: true, minutes: true, createdAt: true } });
  const map = new Map<string, { xp: number; minutes: number }>();
  for (const r of rows) {
    const k = dayKey(r.createdAt);
    const cur = map.get(k) ?? { xp: 0, minutes: 0 };
    cur.xp += r.xp;
    cur.minutes += r.minutes;
    map.set(k, cur);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const k = dayKey(d);
    return { date: k, ...(map.get(k) ?? { xp: 0, minutes: 0 }) };
  });
}

/** Classement par XP gagnée depuis une date (ou total si null). */
export async function leaderboard(since: Date | null, take = 50) {
  if (!since) {
    const users = await db.user.findMany({ orderBy: { xp: "desc" }, take });
    return users.map((u) => ({ user: u, xp: u.xp }));
  }
  const groups = await db.activity.groupBy({ by: ["userId"], where: { createdAt: { gte: since } }, _sum: { xp: true }, orderBy: { _sum: { xp: "desc" } }, take });
  const users = await db.user.findMany({ where: { id: { in: groups.map((g) => g.userId) } } });
  const byId = new Map(users.map((u) => [u.id, u]));
  return groups.filter((g) => byId.has(g.userId)).map((g) => ({ user: byId.get(g.userId)!, xp: g._sum.xp ?? 0 }));
}

export async function weeklyRank(userId: string) {
  const since = startOfWeek();
  const groups = await db.activity.groupBy({ by: ["userId"], where: { createdAt: { gte: since } }, _sum: { xp: true } });
  const sorted = groups.map((g) => ({ id: g.userId, xp: g._sum.xp ?? 0 })).sort((a, b) => b.xp - a.xp);
  const idx = sorted.findIndex((g) => g.id === userId);
  return { rank: idx === -1 ? null : idx + 1, xp: idx === -1 ? 0 : sorted[idx].xp, total: sorted.length };
}
