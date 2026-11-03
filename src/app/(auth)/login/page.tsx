import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <p className="text-5xl">👋</p>
      <h1 className="mt-4 text-4xl font-extrabold">Content de te revoir !</h1>
      <p className="mt-2 text-muted">Ta série t'attend. Connecte-toi pour reprendre là où tu t'étais arrêté.</p>
      <LoginForm next={next} />
      <p className="mt-8 text-center text-sm font-semibold text-muted">
        Pas encore de compte ?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-brand hover:underline">
          Inscris-toi gratuitement
        </Link>
      </p>
    </>
  );
}
