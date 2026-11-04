export const BADGES = [
  { slug: "first-step", name: "Premier pas", description: "Terminer votre première leçon", icon: "footprints", color: "mint", xpReward: 20 },
  { slug: "enrolled", name: "Inscription", description: "S'inscrire à une première formation", icon: "book-open", color: "violet", xpReward: 10 },
  { slug: "collector", name: "Curiosité", description: "Être inscrit à 5 formations", icon: "library", color: "sky", xpReward: 50 },
  { slug: "streak-3", name: "Régularité", description: "Apprendre 3 jours d'affilée", icon: "flame", color: "coral", xpReward: 30 },
  { slug: "streak-7", name: "Semaine complète", description: "Apprendre 7 jours d'affilée", icon: "calendar-check", color: "sun", xpReward: 70 },
  { slug: "streak-30", name: "Discipline", description: "Apprendre 30 jours d'affilée", icon: "mountain", color: "coral", xpReward: 300 },
  { slug: "quiz-ace", name: "Sans faute", description: "Obtenir 100 % à un quiz", icon: "target", color: "pink", xpReward: 40 },
  { slug: "quiz-10", name: "Rappel actif", description: "Réussir 10 quiz", icon: "brain", color: "violet", xpReward: 80 },
  { slug: "finisher", name: "Formation terminée", description: "Terminer une formation à 100 %", icon: "flag", color: "lime", xpReward: 100 },
  { slug: "certified", name: "Certifié", description: "Obtenir un premier certificat", icon: "graduation-cap", color: "sun", xpReward: 120 },
  { slug: "triple-cert", name: "Triple certification", description: "Obtenir 3 certificats", icon: "trophy", color: "sun", xpReward: 250 },
  { slug: "night-owl", name: "Apprenant du soir", description: "Terminer une leçon entre 22 h et 5 h", icon: "moon", color: "ocean", xpReward: 25 },
  { slug: "early-bird", name: "Apprenant matinal", description: "Terminer une leçon entre 5 h et 8 h", icon: "sunrise", color: "sun", xpReward: 25 },
  { slug: "critic", name: "Premier avis", description: "Publier un premier avis", icon: "message-square-quote", color: "pink", xpReward: 15 },
  { slug: "note-taker", name: "Prise de notes", description: "Rédiger 10 notes", icon: "notebook-pen", color: "mint", xpReward: 40 },
  { slug: "level-5", name: "Niveau 5", description: "Atteindre le niveau 5", icon: "star", color: "violet", xpReward: 50 },
  { slug: "level-10", name: "Niveau 10", description: "Atteindre le niveau 10", icon: "crown", color: "sun", xpReward: 150 },
  { slug: "xp-1000", name: "1 000 XP", description: "Cumuler 1 000 points d'expérience", icon: "gem", color: "sky", xpReward: 60 },
] as const;

export type BadgeSlug = (typeof BADGES)[number]["slug"];
