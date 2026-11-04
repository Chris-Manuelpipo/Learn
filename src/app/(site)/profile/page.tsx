import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { ProfileForm, PreferencesForm, PasswordForm } from "@/components/profile/forms";
import { AccentPicker } from "@/components/profile/accent-picker";
import { DEFAULT_PALETTE, isPaletteName } from "@/lib/palettes";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Paramètres" };

const METHOD = { CARD: "Carte bancaire", ORANGE_MONEY: "Orange Money", MTN_MOMO: "MTN MoMo", PAYPAL: "PayPal" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const payments = await db.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { course: { select: { title: true, slug: true } } } });

  return (
    <Container className="max-w-4xl py-10">
      <PageHeader icon={Settings} title="Paramètres" text="Gérez votre profil, vos préférences d'apprentissage et la sécurité de votre compte." />
      <div className="space-y-8">
        <Section title="Profil" text="Ces informations apparaissent sur votre profil public et dans le classement.">
          <ProfileForm
            user={{ name: user.name, username: user.username, headline: user.headline ?? "", bio: user.bio ?? "", country: user.country ?? "", website: user.website ?? "", avatarColor: user.avatarColor, avatarUrl: user.avatarUrl }}
          />
        </Section>
        <Section id="couleur" title="Couleur d'accent" text="Personnalisez la plateforme : la couleur s'applique aux boutons, à votre progression et à vos certificats.">
          <AccentPicker current={isPaletteName(user.accentColor) ? user.accentColor : DEFAULT_PALETTE} />
        </Section>
        <Section id="objectif" title="Préférences d'apprentissage" text="Un objectif réaliste, tenu tous les jours, vaut mieux qu'un objectif ambitieux abandonné.">
          <PreferencesForm goal={user.dailyGoalMinutes} currency={user.currency} />
        </Section>
        <Section title="Sécurité" text={`Connecté avec ${user.email}`}>
          <PasswordForm />
        </Section>
        <Section title="Historique d'achats" text="Vos reçus de paiement (simulés).">
          {payments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-bold uppercase tracking-wider text-muted">
                  <tr>
                    <th className="pb-3">Cours</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Moyen</th>
                    <th className="pb-3 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-line">
                      <td className="py-3 pr-3 font-bold">
                        {p.course.title}
                        <span className="block font-mono text-xs font-semibold text-muted">{p.reference}</span>
                      </td>
                      <td className="py-3 pr-3 text-muted">{formatDate(p.createdAt)}</td>
                      <td className="py-3 pr-3">{METHOD[p.method]}</td>
                      <td className="py-3 text-right font-bold">
                        {p.currency === "XAF" ? `${new Intl.NumberFormat("fr-FR").format(p.amount)} FCFA` : new Intl.NumberFormat("fr-FR", { style: "currency", currency: p.currency }).format(p.amount / 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">Aucun achat pour l'instant.</p>
          )}
        </Section>
      </div>
    </Container>
  );
}

function Section({ title, text, children, id }: { title: string; text?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="card scroll-mt-24 p-6 sm:p-8">
      <h2 className="text-xl font-bold">{title}</h2>
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}
