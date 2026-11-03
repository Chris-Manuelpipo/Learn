import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-grad-a to-grad-b lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.25),transparent_45%)]" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#ffc23d]/40 blur-3xl" />
        <div className="relative flex h-full flex-col justify-center p-14 text-white">
          <div className="mb-10 flex gap-4">
            {["🧠", "🔥", "🎓", "🚀"].map((e, i) => (
              <div
                key={e}
                className="animate-float grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-4xl shadow-xl ring-1 ring-white/30 backdrop-blur"
                style={{ animationDelay: `${-i * 1.3}s`, ["--r" as string]: `${[-6, 4, -3, 7][i]}deg` }}
              >
                {e}
              </div>
            ))}
          </div>
          <h2 className="max-w-lg text-5xl font-extrabold leading-[1.05]">Chaque jour, un petit pas. Chaque mois, un grand saut.</h2>
          <p className="mt-5 max-w-md text-lg text-white/80">
            Des leçons courtes, des quiz qui t'aident à retenir et une communauté qui avance avec toi.
          </p>
          <figure className="mt-12 max-w-md rounded-3xl bg-white/12 p-6 ring-1 ring-white/25 backdrop-blur">
            <blockquote className="text-lg leading-relaxed">« Le système de séries de jours m'a motivé à apprendre tous les jours. J'ai eu mon premier certificat en 3 semaines ! »</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#ffc93d] to-[#ff9f1c] text-xl">🦁</span>
              <span>
                <span className="block font-extrabold">Brice Fotso</span>
                <span className="block text-sm text-white/70">Développeur junior, Douala</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  );
}
