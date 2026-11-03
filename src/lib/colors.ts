// Palette « sticker » partagée par les cours, catégories et avatars.
export const PALETTE = {
  // « violet » est la clé historique : elle suit désormais la couleur de marque.
  violet: { from: "var(--brand)", to: "var(--brand-2)", soft: "var(--brand-soft)", ink: "var(--brand-ink)" },
  coral: { from: "#FF7A59", to: "#FF4E7A", soft: "#FFECE6", ink: "#D23C2A" },
  mint: { from: "#1FD1A0", to: "#14B8C4", soft: "#E2FAF2", ink: "#0B8A6A" },
  sky: { from: "#3BA8FF", to: "#2563EB", soft: "#E5F3FF", ink: "#1F6FD1" },
  sun: { from: "#FFC93D", to: "#FF9F1C", soft: "#FFF6DC", ink: "#B26A00" },
  pink: { from: "#FF5FA2", to: "#FF8A5B", soft: "#FFE8F3", ink: "#C2185B" },
  lime: { from: "#9BE15D", to: "#00C389", soft: "#EEFBE3", ink: "#3F8A12" },
  ocean: { from: "#00B4D8", to: "#0077B6", soft: "#E0F7FC", ink: "#00658F" },
} as const;

export type PaletteKey = keyof typeof PALETTE;

export function palette(key: string | null | undefined) {
  return PALETTE[(key as PaletteKey) ?? "violet"] ?? PALETTE.violet;
}

export function gradient(key: string | null | undefined, angle = 135) {
  const p = palette(key);
  return `linear-gradient(${angle}deg, ${p.from}, ${p.to})`;
}

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];
