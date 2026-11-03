export const BADGES = [
  { slug: "first-step", name: "Premier pas", description: "Terminer ta toute première leçon", emoji: "👣", color: "mint", xpReward: 20 },
  { slug: "enrolled", name: "C'est parti !", description: "S'inscrire à un premier cours", emoji: "🚀", color: "violet", xpReward: 10 },
  { slug: "collector", name: "Collectionneur", description: "Être inscrit à 5 cours", emoji: "📚", color: "sky", xpReward: 50 },
  { slug: "streak-3", name: "Sur la lancée", description: "Apprendre 3 jours d'affilée", emoji: "🔥", color: "coral", xpReward: 30 },
  { slug: "streak-7", name: "Semaine de feu", description: "Apprendre 7 jours d'affilée", emoji: "⚡", color: "sun", xpReward: 70 },
  { slug: "streak-30", name: "Inarrêtable", description: "Apprendre 30 jours d'affilée", emoji: "🌋", color: "coral", xpReward: 300 },
  { slug: "quiz-ace", name: "Sans faute", description: "Obtenir 100 % à un quiz", emoji: "🎯", color: "pink", xpReward: 40 },
  { slug: "quiz-10", name: "Quiz addict", description: "Réussir 10 quiz", emoji: "🧠", color: "violet", xpReward: 80 },
  { slug: "finisher", name: "Finisseur", description: "Terminer un cours à 100 %", emoji: "🏁", color: "lime", xpReward: 100 },
  { slug: "certified", name: "Certifié", description: "Obtenir un premier certificat", emoji: "🎓", color: "sun", xpReward: 120 },
  { slug: "triple-cert", name: "Triple diplômé", description: "Obtenir 3 certificats", emoji: "🏆", color: "sun", xpReward: 250 },
  { slug: "night-owl", name: "Oiseau de nuit", description: "Terminer une leçon entre 22 h et 5 h", emoji: "🦉", color: "ocean", xpReward: 25 },
  { slug: "early-bird", name: "Lève-tôt", description: "Terminer une leçon entre 5 h et 8 h", emoji: "🌅", color: "sun", xpReward: 25 },
  { slug: "critic", name: "Critique avisé", description: "Laisser un premier avis", emoji: "✍️", color: "pink", xpReward: 15 },
  { slug: "note-taker", name: "Preneur de notes", description: "Écrire 10 notes", emoji: "📝", color: "mint", xpReward: 40 },
  { slug: "level-5", name: "Niveau 5", description: "Atteindre le niveau 5", emoji: "⭐", color: "violet", xpReward: 50 },
  { slug: "level-10", name: "Niveau 10", description: "Atteindre le niveau 10", emoji: "🌟", color: "sun", xpReward: 150 },
  { slug: "xp-1000", name: "Mille XP", description: "Cumuler 1 000 XP", emoji: "💎", color: "sky", xpReward: 60 },
] as const;

export type BadgeSlug = (typeof BADGES)[number]["slug"];
