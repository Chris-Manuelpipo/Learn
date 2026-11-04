import Link from "next/link";
import { Flame, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { db } from "@/lib/db";
import { levelInfo } from "@/lib/gamification";
import { buttonClass } from "@/components/ui/button";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { CurrencySwitcher } from "./currency-switcher";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { HeaderSearch } from "./header-search";

export async function Header() {
  const [user, currency] = await Promise.all([getCurrentUser(), getCurrency()]);
  const notifications = user
    ? await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12 })
    : [];
  const level = user ? levelInfo(user.xp) : null;

  const links = user
    ? [
        { href: "/dashboard", label: "Accueil" },
        { href: "/courses", label: "Catalogue" },
        { href: "/my-courses", label: "Mes cours" },
        { href: "/leaderboard", label: "Classement" },
      ]
    : [
        { href: "/courses", label: "Catalogue" },
        { href: "/leaderboard", label: "Classement" },
        { href: "/become-instructor", label: "Enseigner" },
      ];

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav links={links} user={user ? { name: user.name, role: user.role } : null} />
        <Logo className="mr-2" href={user ? "/dashboard" : "/"} />
        <NavLinks links={links} />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <HeaderSearch />
          <CurrencySwitcher value={currency} />
          <ThemeToggle />
          {user && level ? (
            <>
              <Link
                href="/badges"
                className="hidden items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-1.5 text-sm font-bold transition hover:border-line-strong md:flex"
                title={`Série de ${user.streak} jours · ${user.xp} XP`}
              >
                <span className={`flex items-center gap-1 ${user.streak > 0 ? "text-coral" : "text-muted"}`}>
                  <Flame className="h-4 w-4" />
                  {user.streak}
                </span>
                <span className="flex items-center gap-1 text-ink-soft">
                  <Zap className="h-4 w-4 text-brand" />
                  {user.xp}
                </span>
              </Link>
              <NotificationsMenu
                items={notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, icon: n.icon, href: n.href, read: n.read, createdAt: n.createdAt.toISOString() }))}
              />
              <UserMenu
                user={{ name: user.name, email: user.email, username: user.username, role: user.role, avatarColor: user.avatarColor, avatarUrl: user.avatarUrl }}
                level={level}
              />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
                Connexion
              </Link>
              <Link href="/register" className={buttonClass("primary", "sm")}>
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
