import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { coverSrc } from "@/components/course/course-cover";

const PHOTO = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=70&w=1200&h=750";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <aside className="relative hidden overflow-hidden lg:block" style={{ background: "var(--night)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverSrc(PHOTO, 1400)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="relative flex h-full flex-col justify-end p-14 text-white">
          <h2 className="max-w-lg text-4xl font-bold leading-tight">Un peu chaque jour, beaucoup en un mois.</h2>
          <p className="mt-4 max-w-md text-lg text-white/75">Des leçons courtes, des quiz pour ancrer vos acquis et des certificats reconnus.</p>
          <figure className="mt-10 max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
            <blockquote className="leading-relaxed text-white/90">
              « La régularité a tout changé pour moi : quinze minutes par jour, et j'ai obtenu mon premier certificat en trois semaines. »
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://i.pravatar.cc/120?img=51" alt="" className="h-10 w-10 rounded-full object-cover" />
              <span>
                <span className="block text-sm font-semibold">Brice Fotso</span>
                <span className="block text-sm text-white/65">Développeur junior, Douala</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  );
}
