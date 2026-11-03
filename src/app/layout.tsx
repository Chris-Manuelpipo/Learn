import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import { PaletteSwitcher } from "@/components/layout/palette-switcher";
import { DEFAULT_PALETTE, PALETTE_COOKIE, isPaletteName, paletteCss } from "@/lib/palettes";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700", "800"] });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Learn — Apprends à ton rythme", template: "%s · Learn" },
  description: "Cours en ligne vidéo, quiz, certificats et gamification. Apprends à ton rythme, en français.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#111315" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get(PALETTE_COOKIE)?.value;
  const palette = isPaletteName(saved) ? saved : DEFAULT_PALETTE;
  return (
    <html lang="fr" suppressHydrationWarning data-palette={palette} className={`${display.variable} ${body.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
      </head>
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
        <PaletteSwitcher current={palette} />
      </body>
    </html>
  );
}
