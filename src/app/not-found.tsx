import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <LogoMark size={48} className="mx-auto" />
        <p className="mt-8 font-display text-[8rem] font-extrabold leading-none text-gradient">404</p>
        <h1 className="mt-2 text-3xl font-extrabold">Cette page a séché les cours 🙈</h1>
        <p className="mt-3 text-muted">Elle n'existe pas ou a été déplacée.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonClass("primary", "lg")}>Accueil</Link>
          <Link href="/courses" className={buttonClass("secondary", "lg")}>Catalogue</Link>
        </div>
      </div>
    </div>
  );
}
