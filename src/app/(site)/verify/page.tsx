import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Vérifier un certificat" };

async function go(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code) redirect(`/verify/${encodeURIComponent(code)}`);
}

export default function VerifyPage() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-brand-ink">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-4xl font-bold">Vérifier un certificat</h1>
        <p className="mt-3 text-muted">Saisissez l'identifiant inscrit sur le certificat, ou scannez son QR code, pour vérifier son authenticité.</p>
        <form action={go} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Input name="code" placeholder="LRN-XXXX-XXXX-XXXX" className="font-mono uppercase" required />
          <Button size="lg" type="submit">
            Vérifier
          </Button>
        </form>
      </div>
    </Container>
  );
}
