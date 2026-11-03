import Link from "next/link";
import { Logo } from "./logo";

const COLS = [
  { title: "Apprendre", links: [["Catalogue", "/courses"], ["Cours gratuits", "/courses?price=free"], ["Cours certifiants", "/courses?certified=1"], ["Classement", "/leaderboard"]] },
  { title: "Catégories", links: [["Développement web", "/courses?category=developpement-web"], ["Data & IA", "/courses?category=data-ia"], ["Design & UX", "/courses?category=design-ux"], ["Business", "/courses?category=business"]] },
  { title: "Learn", links: [["Devenir formateur", "/become-instructor"], ["Vérifier un certificat", "/verify"], ["Créer un compte", "/register"]] },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Des cours courts, concrets et certifiants pour apprendre à ton rythme. Conçus avec les sciences cognitives pour que ça reste.
          </p>
          <p className="mt-6 text-2xl">🦊 🐼 🦉 🚀</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="mb-4 text-sm font-extrabold uppercase tracking-wider text-ink">{c.title}</p>
            <ul className="space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm font-medium text-muted transition hover:text-brand">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-6 text-center text-xs font-medium text-muted">
        © {new Date().getFullYear()} Learn · Fait avec 💜 pour les apprenants curieux · Paiements simulés (démo)
      </div>
    </footer>
  );
}
