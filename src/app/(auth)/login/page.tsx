import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p className="mt-2 text-muted">Heureux de vous revoir. Connectez-vous pour reprendre votre formation.</p>
      <LoginForm next={next} />
      <p className="mt-8 text-center text-sm font-semibold text-muted">
        Pas encore de compte ?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">
          Créer un compte gratuit
        </Link>
      </p>
    </>
  );
}
