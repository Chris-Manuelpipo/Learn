"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Copier le lien" }: { text: string; label?: string }) {
  return (
    <Button
      variant="secondary"
      size="lg"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast.success("Lien copié");
      }}
    >
      <Link2 className="h-5 w-5" /> {label}
    </Button>
  );
}
