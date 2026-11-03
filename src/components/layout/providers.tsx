"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { CelebrationProvider } from "@/components/gamification/celebration";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <CelebrationProvider>{children}</CelebrationProvider>
      </TooltipProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border-2 !border-line !bg-surface !text-ink !font-sans !font-semibold !shadow-[var(--shadow-pop)]",
            description: "!text-muted",
          },
        }}
      />
    </ThemeProvider>
  );
}
