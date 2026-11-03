"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Award, BookOpen, GraduationCap, LayoutDashboard, LogOut, NotebookPen, Palette, Settings, Shield, Sparkles, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { logout } from "@/app/actions/auth";

type Props = {
  user: { name: string; email: string; username: string; role: string; avatarEmoji: string; avatarColor: string; avatarUrl: string | null };
  level: { level: number; title: string; percent: number; current: number; needed: number };
};

export function UserMenu({ user, level }: Props) {
  const item = "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none data-[highlighted]:bg-surface-2";
  return (
    <DM.Root>
      <DM.Trigger className="rounded-full outline-none transition hover:scale-105" aria-label="Menu du compte">
        <Avatar user={user} size={40} />
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={8} className="z-[60] w-72 rounded-3xl border-2 border-line bg-surface p-2 shadow-[var(--shadow-pop)]">
          <div className="flex items-center gap-3 p-3">
            <Avatar user={user} size={48} />
            <div className="min-w-0">
              <p className="truncate font-extrabold">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <div className="mx-1 mb-2 rounded-2xl bg-surface-2 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-extrabold">
              <span>
                Niv. {level.level} · <span className="text-brand">{level.title}</span>
              </span>
              <span className="text-muted">
                {level.current}/{level.needed} XP
              </span>
            </div>
            <ProgressBar value={level.percent} height={8} color="linear-gradient(90deg,var(--grad-a),var(--grad-b))" />
          </div>
          <DM.Item asChild><Link href="/dashboard" className={item}><LayoutDashboard className="h-4 w-4 text-muted" /> Tableau de bord</Link></DM.Item>
          <DM.Item asChild><Link href="/my-courses" className={item}><BookOpen className="h-4 w-4 text-muted" /> Mes cours</Link></DM.Item>
          <DM.Item asChild><Link href="/certificates" className={item}><GraduationCap className="h-4 w-4 text-muted" /> Mes certificats</Link></DM.Item>
          <DM.Item asChild><Link href="/badges" className={item}><Award className="h-4 w-4 text-muted" /> Badges & succès</Link></DM.Item>
          <DM.Item asChild><Link href="/notes" className={item}><NotebookPen className="h-4 w-4 text-muted" /> Mes notes</Link></DM.Item>
          <DM.Item asChild><Link href={`/u/${user.username}`} className={item}><User className="h-4 w-4 text-muted" /> Profil public</Link></DM.Item>
          <DM.Item asChild><Link href="/profile#couleur" className={item}><Palette className="h-4 w-4 text-muted" /> Couleur d'accent</Link></DM.Item>
          <DM.Item asChild><Link href="/profile" className={item}><Settings className="h-4 w-4 text-muted" /> Paramètres</Link></DM.Item>
          <DM.Separator className="my-1.5 h-px bg-line" />
          {user.role !== "STUDENT" ? (
            <DM.Item asChild><Link href="/studio" className={item}><Sparkles className="h-4 w-4 text-brand" /> Studio formateur</Link></DM.Item>
          ) : (
            <DM.Item asChild><Link href="/become-instructor" className={item}><Sparkles className="h-4 w-4 text-brand" /> Devenir formateur</Link></DM.Item>
          )}
          {user.role === "ADMIN" && (
            <DM.Item asChild><Link href="/admin" className={item}><Shield className="h-4 w-4 text-coral" /> Administration</Link></DM.Item>
          )}
          <DM.Separator className="my-1.5 h-px bg-line" />
          <DM.Item className={item} onSelect={() => logout()}>
            <LogOut className="h-4 w-4 text-muted" /> Se déconnecter
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
