"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

function useParamUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in changes)) next.delete("page");
    start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { params, update, pending };
}

export function CatalogSearch({ initial }: { initial: string }) {
  const { update } = useParamUpdater();
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update({ q: q.trim() || null });
      }}
      className="relative"
    >
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Python, design, anglais, marketing…"
        className="h-14 w-full rounded-2xl border-2 border-line bg-surface pl-14 pr-32 text-base font-medium shadow-[var(--shadow-soft)] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <button className="absolute right-2 top-2 h-10 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand transition hover:brightness-110 active:scale-95">
        Rechercher
      </button>
    </form>
  );
}

const SORTS = [
  ["popular", "Les plus populaires"],
  ["rating", "Les mieux notés"],
  ["newest", "Les plus récents"],
  ["short", "Les plus courts"],
  ["price-asc", "Prix croissant"],
  ["price-desc", "Prix décroissant"],
] as const;

export function CatalogSort() {
  const { params, update } = useParamUpdater();
  return (
    <select
      value={params.get("sort") ?? "popular"}
      onChange={(e) => update({ sort: e.target.value === "popular" ? null : e.target.value })}
      className="h-10 cursor-pointer rounded-xl border-2 border-line bg-surface px-3 text-sm font-bold outline-none focus:border-brand"
      aria-label="Trier"
    >
      {SORTS.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

type Cat = { slug: string; name: string; icon: string; count: number };

export function CatalogFilters({ categories }: { categories: Cat[] }) {
  const { params, update, pending } = useParamUpdater();
  const [open, setOpen] = useState(false);
  const list = (k: string) => (params.get(k) ?? "").split(",").filter(Boolean);
  const toggle = (k: string, v: string) => {
    const cur = list(k);
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    update({ [k]: next.join(",") || null });
  };
  const activeCount = ["category", "level", "price", "certified", "duration", "rating"].filter((k) => params.get(k)).length;

  const chip = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
      active ? "bg-brand-soft text-brand-ink" : "text-ink-soft hover:bg-surface-2",
    );
  const box = (active: boolean) =>
    cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 text-[10px] text-on-brand transition", active ? "border-brand bg-brand" : "border-line-strong");

  const content = (
    <div className={cn("space-y-7 transition-opacity", pending && "opacity-60")}>
      <Group title="Catégories">
        {categories.map((c) => {
          const active = list("category").includes(c.slug);
          return (
            <button key={c.slug} onClick={() => toggle("category", c.slug)} className={chip(active)}>
              <span className="text-lg">{c.icon}</span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-muted">{c.count}</span>
            </button>
          );
        })}
      </Group>
      <Group title="Niveau">
        {[
          ["BEGINNER", "🌱 Débutant"],
          ["INTERMEDIATE", "🌿 Intermédiaire"],
          ["ADVANCED", "🌳 Avancé"],
        ].map(([v, l]) => {
          const active = list("level").includes(v);
          return (
            <button key={v} onClick={() => toggle("level", v)} className={chip(active)}>
              <span className={box(active)}>{active && "✓"}</span>
              {l}
            </button>
          );
        })}
      </Group>
      <Group title="Prix">
        {[
          [null, "Tous"],
          ["free", "🎁 Gratuits"],
          ["paid", "💳 Payants"],
        ].map(([v, l]) => {
          const active = (params.get("price") ?? null) === v;
          return (
            <button key={l} onClick={() => update({ price: v })} className={chip(active)}>
              <span className={cn(box(active), "rounded-full")}>{active && "●"}</span>
              {l}
            </button>
          );
        })}
      </Group>
      <Group title="Durée">
        {[
          [null, "Toutes"],
          ["short", "⚡ Moins de 2 h"],
          ["medium", "⏳ 2 à 4 h"],
          ["long", "🏔️ Plus de 4 h"],
        ].map(([v, l]) => {
          const active = (params.get("duration") ?? null) === v;
          return (
            <button key={l} onClick={() => update({ duration: v })} className={chip(active)}>
              <span className={cn(box(active), "rounded-full")}>{active && "●"}</span>
              {l}
            </button>
          );
        })}
      </Group>
      <Group title="Options">
        <button onClick={() => update({ certified: params.get("certified") ? null : "1" })} className={chip(!!params.get("certified"))}>
          <span className={box(!!params.get("certified"))}>{params.get("certified") && "✓"}</span>
          🎓 Avec certificat
        </button>
        <button onClick={() => update({ rating: params.get("rating") ? null : "4.5" })} className={chip(!!params.get("rating"))}>
          <span className={box(!!params.get("rating"))}>{params.get("rating") && "✓"}</span>
          ⭐ Note 4,5 et plus
        </button>
      </Group>
      {activeCount > 0 && (
        <button
          onClick={() => update({ category: null, level: null, price: null, certified: null, duration: null, rating: null })}
          className="flex items-center gap-1.5 text-sm font-bold text-coral hover:underline"
        >
          <X className="h-4 w-4" /> Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-line bg-surface py-3 font-bold lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filtres {activeCount > 0 && <span className="rounded-full bg-brand px-2 text-xs text-on-brand">{activeCount}</span>}
      </button>
      <aside className={cn("lg:sticky lg:top-24 lg:block lg:self-start", open ? "block" : "hidden")}>
        <div className="card p-4 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">{content}</div>
      </aside>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-3 text-xs font-extrabold uppercase tracking-wider text-muted">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const { update } = useParamUpdater();
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const go = (n: number) => {
    update({ page: n === 1 ? null : String(n) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => go(page - 1)} className="grid h-11 w-11 place-items-center rounded-xl border-2 border-line bg-surface disabled:opacity-40" aria-label="Page précédente">
        <ChevronLeft className="h-5 w-5" />
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && nums[i - 1] !== n - 1 && <span className="px-1 text-muted">…</span>}
          <button
            onClick={() => go(n)}
            className={cn("h-11 min-w-11 rounded-xl px-3 font-extrabold transition", n === page ? "bg-brand text-on-brand shadow-[0_4px_0_var(--chunk)]" : "border-2 border-line bg-surface hover:border-brand")}
          >
            {n}
          </button>
        </span>
      ))}
      <button disabled={page >= pages} onClick={() => go(page + 1)} className="grid h-11 w-11 place-items-center rounded-xl border-2 border-line bg-surface disabled:opacity-40" aria-label="Page suivante">
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
