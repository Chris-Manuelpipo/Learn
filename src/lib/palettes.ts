// Palettes de marque. Les neutres (fonds, textes, bordures) sont dans globals.css ;
// ici on ne définit que ce qui porte l'identité de la plateforme.
type Tone = {
  brand: string; // couleur principale (boutons, liens, accents)
  ink: string; // variante contrastée (texte coloré, survol)
  soft: string; // fond teinté léger
  brand2: string; // partenaire des dégradés
  chunk: string; // ombre pleine sous les boutons
  night: string; // panneaux sombres (bandeaux, tooltips)
  night2: string;
  onBrand: string; // texte posé sur la couleur principale
};

export const PALETTES = {
  emerald: {
    label: "Vert émeraude",
    light: { brand: "#0E9F6E", ink: "#0B7F58", soft: "#E3F6EE", brand2: "#14B8A6", chunk: "#08704D", night: "#0F1F1A", night2: "#13513C", onBrand: "#FFFFFF" },
    dark: { brand: "#2FCB8E", ink: "#6EE7B7", soft: "#12352A", brand2: "#2DD4BF", chunk: "#178A5F", night: "#0E1A16", night2: "#14402F", onBrand: "#06281B" },
  },
  blue: {
    label: "Bleu électrique",
    light: { brand: "#2563EB", ink: "#1D4ED8", soft: "#E8F0FF", brand2: "#06B6D4", chunk: "#1A44B8", night: "#0E1630", night2: "#1E3A8A", onBrand: "#FFFFFF" },
    dark: { brand: "#5B8DEF", ink: "#93B4F8", soft: "#1A2747", brand2: "#22D3EE", chunk: "#2F5FC7", night: "#0D1426", night2: "#1B2F66", onBrand: "#FFFFFF" },
  },
  coral: {
    label: "Orange corail",
    light: { brand: "#E8491F", ink: "#C23A15", soft: "#FFEDE6", brand2: "#FF9F1C", chunk: "#A8340F", night: "#24130D", night2: "#6B2712", onBrand: "#FFFFFF" },
    dark: { brand: "#FF7A52", ink: "#FFA586", soft: "#3A1D14", brand2: "#FFB547", chunk: "#C9502E", night: "#1C120E", night2: "#542013", onBrand: "#2A0E05" },
  },
  noir: {
    label: "Jaune & noir",
    light: { brand: "#16161A", ink: "#16161A", soft: "#FFF4CC", brand2: "#FFC531", chunk: "#FFC531", night: "#16161A", night2: "#34343C", onBrand: "#FFFFFF" },
    dark: { brand: "#FFC531", ink: "#FFD666", soft: "#3A3214", brand2: "#FF9F1C", chunk: "#B88A12", night: "#0E0E10", night2: "#2A2A30", onBrand: "#16161A" },
  },
} as const satisfies Record<string, { label: string; light: Tone; dark: Tone }>;

export type PaletteName = keyof typeof PALETTES;
export const DEFAULT_PALETTE: PaletteName = "emerald";
export const PALETTE_COOKIE = "learn_palette";

export function isPaletteName(v: unknown): v is PaletteName {
  return typeof v === "string" && v in PALETTES;
}

function vars(t: Tone) {
  return [
    `--brand:${t.brand}`,
    `--brand-ink:${t.ink}`,
    `--brand-soft:${t.soft}`,
    `--brand-2:${t.brand2}`,
    `--chunk:${t.chunk}`,
    `--night:${t.night}`,
    `--night-2:${t.night2}`,
    `--on-brand:${t.onBrand}`,
    `--ring:${t.brand}55`,
  ].join(";");
}

/** CSS de toutes les palettes, sélectionnées par l'attribut data-palette de <html>. */
export function paletteCss() {
  return Object.entries(PALETTES)
    .map(([name, p]) => {
      const sel = name === DEFAULT_PALETTE ? `:root,:root[data-palette="${name}"]` : `:root[data-palette="${name}"]`;
      const darkSel = name === DEFAULT_PALETTE ? `:root.dark,:root.dark[data-palette="${name}"]` : `:root.dark[data-palette="${name}"]`;
      // Le certificat est toujours imprimé sur fond clair : il garde la teinte claire.
      return `${sel}{${vars(p.light)};--brand-print:${p.light.ink}}${darkSel}{${vars(p.dark)}}`;
    })
    .join("\n");
}
