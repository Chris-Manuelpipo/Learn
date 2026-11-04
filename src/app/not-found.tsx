import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <LogoMark size={48} className="mx-auto" />
        <p className="mt-8 text-7xl font-bold leading-none tracking-tight text-brand">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page introuvable</h1>
        <p className="mt-3 text-muted">La page demandée n'existe pas ou a été déplacée.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonClass("primary", "lg")}>Accueil</Link>
          <Link href="/courses" className={buttonClass("secondary", "lg")}>Catalogue</Link>
        </div>
      </div>
    </div>
  );
}
