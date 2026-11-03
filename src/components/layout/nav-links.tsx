"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link key={l.href} href={l.href} className={cn("relative rounded-xl px-3.5 py-2 text-[0.95rem] font-bold transition", active ? "text-brand" : "text-ink-soft hover:text-ink")}>
            {active && <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-xl bg-brand-soft" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
