"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "./logo";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileNav({ links, user }: { links: { href: string; label: string }[]; user: { name: string; role: string } | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const extra = user
    ? [
        { href: "/certificates", label: "Mes certificats" },
        { href: "/badges", label: "Badges" },
        { href: "/profile", label: "Paramètres" },
        ...(user.role !== "STUDENT" ? [{ href: "/studio", label: "Studio formateur" }] : [{ href: "/become-instructor", label: "Devenir formateur" }]),
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Administration" }] : []),
      ]
    : [];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-surface-2 lg:hidden" aria-label="Ouvrir le menu">
        <Menu className="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-[71] flex w-[85vw] max-w-sm flex-col bg-surface p-5 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-xl font-bold">
              <LogoMark size={32} /> learn
            </Dialog.Title>
            <Dialog.Close className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-2" aria-label="Fermer">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <nav className="flex flex-col gap-1">
            {[...links, ...extra].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn("rounded-2xl px-4 py-3 text-lg font-bold", pathname.startsWith(l.href) ? "bg-brand-soft text-brand" : "hover:bg-surface-2")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          {!user && (
            <div className="mt-auto grid gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className={buttonClass("secondary", "lg")}>Connexion</Link>
              <Link href="/register" onClick={() => setOpen(false)} className={buttonClass("primary", "lg")}>Créer un compte</Link>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
