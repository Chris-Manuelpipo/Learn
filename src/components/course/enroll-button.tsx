"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { enrollFree } from "@/app/actions/courses";

export function EnrollButton({ courseId, slug, free, loggedIn, priceLabel }: { courseId: string; slug: string; free: boolean; loggedIn: boolean; priceLabel: string }) {
  const [pending, start] = useTransition();
  if (!loggedIn) {
    return (
      <Link href={`/register?next=/courses/${slug}`} className={buttonClass("primary", "lg", "mt-5 w-full")}>
        {free ? "S'inscrire gratuitement" : `Acheter · ${priceLabel}`}
      </Link>
    );
  }
  if (!free) {
    return (
      <Link href={`/checkout/${slug}`} className={buttonClass("primary", "lg", "mt-5 w-full")}>
        Acheter la formation
      </Link>
    );
  }
  return (
    <Button size="lg" variant="mint" className="mt-5 w-full" loading={pending} onClick={() => start(() => enrollFree(courseId))}>
      S'inscrire gratuitement
    </Button>
  );
}
