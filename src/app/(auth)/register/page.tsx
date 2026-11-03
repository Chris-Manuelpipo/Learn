import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <RegisterForm next={next} />
      <p className="mt-8 text-center text-sm font-semibold text-muted">
        Déjà inscrit ?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-extrabold text-brand hover:underline">
          Connecte-toi
        </Link>
      </p>
    </>
  );
}
