"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useTransition } from "react";
import { markNotificationsRead } from "@/app/actions/courses";
import { cn, timeAgo } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon";

type N = { id: string; title: string; body: string; icon: string; href: string | null; read: boolean; createdAt: string };

export function NotificationsMenu({ items }: { items: N[] }) {
  const unread = items.filter((n) => !n.read).length;
  const [, start] = useTransition();
  return (
    <DM.Root onOpenChange={(open) => !open && unread && start(() => markNotificationsRead())}>
      <DM.Trigger className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft transition hover:bg-surface-2 hover:text-ink" aria-label={`Notifications (${unread} non lues)`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white ring-2 ring-bg">{unread}</span>
        )}
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={8} className="z-[60] w-[min(92vw,380px)] rounded-3xl border border-line bg-surface p-2 shadow-[var(--shadow-pop)]">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-lg font-bold">Notifications</p>
            {unread > 0 && <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-bold text-coral">{unread} non lue{unread > 1 ? "s" : ""}</span>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">Aucune notification pour le moment.</p>}
            {items.map((n) => (
              <DM.Item key={n.id} asChild>
                <Link href={n.href ?? "#"} className={cn("flex gap-3 rounded-2xl p-3 outline-none data-[highlighted]:bg-surface-2", !n.read && "bg-brand-soft/60")}>
                  <IconTile name={n.icon} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-snug">{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.body}</span>
                    <span className="mt-1 block text-[11px] font-semibold text-muted/80">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
                </Link>
              </DM.Item>
            ))}
          </div>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
