"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="relative hidden xl:block"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/courses${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Que veux-tu apprendre ?"
        className="h-10 w-64 rounded-xl border-2 border-line bg-surface pl-10 pr-3 text-sm font-medium outline-none transition placeholder:text-muted focus:w-72 focus:border-brand"
      />
    </form>
  );
}
