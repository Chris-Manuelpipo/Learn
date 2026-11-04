import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
// Polices auto-hébergées : le build ne dépend pas de Google Fonts.
import "@fontsource-variable/plus-jakarta-sans";
import { Providers } from "@/components/layout/providers";
import { DEFAULT_PALETTE, PALETTE_COOKIE, isPaletteName, paletteCss } from "@/lib/palettes";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Learn — Formations en ligne certifiantes", template: "%s · Learn" },
  description: "Formations en ligne en français : vidéos courtes, quiz, certificats vérifiables. Apprenez à votre rythme.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#111315" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Le choix du compte prime ; le cookie garde la dernière couleur pour les pages publiques.
  const user = await getCurrentUser();
  const saved = user?.accentColor ?? (await cookies()).get(PALETTE_COOKIE)?.value;
  const palette = isPaletteName(saved) ? saved : DEFAULT_PALETTE;
  return (
    <html lang="fr" suppressHydrationWarning data-palette={palette}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
