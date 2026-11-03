// Règles de progression : XP, niveaux, titres.
export const XP = {
  LESSON: 10,
  QUIZ_PASS: 25,
  QUIZ_PERFECT_BONUS: 15,
  COURSE_COMPLETE: 100,
  CERTIFICATE: 150,
  REVIEW: 15,
  DAILY_GOAL: 20,
  ENROLL: 5,
} as const;

const TITLES = [
  "Curieux",
  "Explorateur",
  "Apprenti",
  "Studieux",
  "Passionné",
  "Érudit",
  "Expert",
  "Virtuose",
  "Maître",
  "Sage",
  "Légende",
];

export function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
}

export function xpForLevel(level: number) {
  return 50 * (level - 1) ** 2;
}

export function levelInfo(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    title: TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))],
    current: xp - floor,
    needed: ceil - floor,
    percent: Math.round(((xp - floor) / (ceil - floor)) * 100),
    nextAt: ceil,
  };
}

export function leagueFor(weeklyXp: number) {
  if (weeklyXp >= 600) return { name: "Diamant", emoji: "💎", color: "sky" };
  if (weeklyXp >= 300) return { name: "Or", emoji: "🥇", color: "sun" };
  if (weeklyXp >= 120) return { name: "Argent", emoji: "🥈", color: "violet" };
  return { name: "Bronze", emoji: "🥉", color: "coral" };
}
