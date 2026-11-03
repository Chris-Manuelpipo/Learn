"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CreditCard, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { processPayment } from "@/app/actions/checkout";
import { useCelebrate, fireConfetti } from "@/components/gamification/celebration";
import { CourseCover } from "@/components/course/course-cover";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { CURRENCIES, formatPrice, type Currency } from "@/lib/currency";
import { cn, formatDuration } from "@/lib/utils";

type Course = { id: string; slug: string; title: string; emoji: string; color: string; coverUrl: string | null; price: number; instructor: string; chapters: number; durationMinutes: number; certified: boolean };
type Method = "CARD" | "ORANGE_MONEY" | "MTN_MOMO" | "PAYPAL";

const METHODS: { id: Method; label: string; sub: string; badge: React.ReactNode }[] = [
  { id: "MTN_MOMO", label: "MTN MoMo", sub: "Mobile Money", badge: <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffcc00] text-xs font-black text-[#003c71]">MoMo</span> },
  { id: "ORANGE_MONEY", label: "Orange Money", sub: "Mobile Money", badge: <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7900] text-lg font-black text-white">OM</span> },
  { id: "CARD", label: "Carte bancaire", sub: "Visa, Mastercard", badge: <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#16122b] to-[#4b2fd6] text-white"><CreditCard className="h-5 w-5" /></span> },
  { id: "PAYPAL", label: "PayPal", sub: "Compte PayPal", badge: <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#003087] text-lg font-black italic text-white">P</span> },
];

export function CheckoutForm({ course, initialCurrency, user }: { course: Course; initialCurrency: Currency; user: { name: string; email: string } }) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [method, setMethod] = useState<Method>("MTN_MOMO");
  const [card, setCard] = useState({ number: "", name: user.name.toUpperCase(), expiry: "", cvc: "" });
  const [phone, setPhone] = useState("");
  const [paypal, setPaypal] = useState(user.email);
  const [flip, setFlip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"form" | "processing" | "success">("form");
  const [reference, setReference] = useState("");
  const [pending, start] = useTransition();
  const celebrate = useCelebrate();

  const price = formatPrice(course.price, currency);
  const mobile = method === "MTN_MOMO" || method === "ORANGE_MONEY";

  const pay = () => {
    setError(null);
    const details: Record<string, string> = method === "CARD" ? card : mobile ? { phone } : { email: paypal };
    setStage("processing");
    start(async () => {
      const res = await processPayment({ courseId: course.id, method, currency, details });
      if (res.error) {
        setStage("form");
        setError(res.error);
        return;
      }
      setReference(res.reference!);
      setStage("success");
      fireConfetti(true);
      setTimeout(() => celebrate(res.reward), 1200);
    });
  };

  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const fmtExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  if (stage === "success") {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card mx-auto max-w-lg p-8 text-center sm:p-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }} className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-mint text-5xl text-white shadow-[0_6px_0_#0ea47b]">
          ✓
        </motion.div>
        <h1 className="mt-6 text-3xl font-extrabold">Paiement réussi !</h1>
        <p className="mt-2 text-muted">
          Tu as maintenant accès à <span className="font-bold text-ink">{course.title}</span>. Un reçu est disponible dans ton profil.
        </p>
        <div className="mt-6 rounded-2xl bg-surface-2 p-4 text-left text-sm">
          <Row k="Référence" v={<span className="font-mono">{reference}</span>} />
          <Row k="Montant" v={price} />
          <Row k="Moyen" v={METHODS.find((m) => m.id === method)!.label} />
        </div>
        <Link href={`/learn/${course.slug}`} className={buttonClass("primary", "lg", "mt-8 w-full")}>
          Commencer le cours 🚀
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="min-w-0">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Finaliser l'achat</h1>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted">
          <Lock className="h-4 w-4" /> Paiement simulé pour la démo : aucun débit réel.
        </p>

        <p className="mb-3 mt-8 text-sm font-extrabold uppercase tracking-wider text-muted">Moyen de paiement</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMethod(m.id);
                setError(null);
              }}
              className={cn("flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition", method === m.id ? "border-brand bg-brand-soft shadow-[0_4px_0_var(--brand)]" : "border-line bg-surface hover:border-line-strong")}
            >
              {m.badge}
              <span className="flex-1">
                <span className="block font-extrabold">{m.label}</span>
                <span className="text-xs font-semibold text-muted">{m.sub}</span>
              </span>
              <span className={cn("h-5 w-5 rounded-full border-2", method === m.id ? "border-[6px] border-brand" : "border-line-strong")} />
            </button>
          ))}
        </div>

        <div className="card mt-6 p-5 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div key={method} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
              {method === "CARD" && (
                <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-center">
                  <div className="space-y-4">
                    <Field label="Numéro de carte" hint="Test : 4242 4242 4242 4242 (acceptée) · …0002 (refusée)">
                      <Input inputMode="numeric" placeholder="1234 5678 9012 3456" value={card.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} onFocus={() => setFlip(false)} />
                    </Field>
                    <Field label="Titulaire">
                      <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} onFocus={() => setFlip(false)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Expiration">
                        <Input inputMode="numeric" placeholder="MM/AA" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: fmtExp(e.target.value) })} onFocus={() => setFlip(false)} />
                      </Field>
                      <Field label="CVC">
                        <Input inputMode="numeric" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 3) })} onFocus={() => setFlip(true)} onBlur={() => setFlip(false)} />
                      </Field>
                    </div>
                  </div>
                  <div className="[perspective:1000px]">
                    <motion.div animate={{ rotateY: flip ? 180 : 0 }} transition={{ duration: 0.6 }} className="relative aspect-[1.586] w-full [transform-style:preserve-3d]">
                      <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#16122b] via-[#4b2fd6] to-[#c54bff] p-5 text-white shadow-[var(--shadow-pop)] [backface-visibility:hidden]">
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
                        <div className="flex items-center justify-between">
                          <span className="h-8 w-11 rounded-md bg-gradient-to-br from-[#ffd76a] to-[#d9a520]" />
                          <span className="font-display text-lg font-extrabold italic">learn</span>
                        </div>
                        <p className="font-mono text-lg tracking-widest">{card.number || "•••• •••• •••• ••••"}</p>
                        <div className="flex justify-between text-xs">
                          <span className="truncate font-bold">{card.name || "TON NOM"}</span>
                          <span className="font-mono">{card.expiry || "MM/AA"}</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#4b2fd6] to-[#16122b] text-white shadow-[var(--shadow-pop)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="mt-6 h-10 bg-black/70" />
                        <div className="mx-5 mt-5 flex h-9 items-center justify-end rounded bg-white/90 px-3 font-mono text-[#16122b]">{card.cvc || "•••"}</div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}
              {mobile && (
                <div className="space-y-4">
                  <Field label={`Numéro ${method === "MTN_MOMO" ? "MTN" : "Orange"}`} hint="9 chiffres commençant par 6, ex. 6 77 12 34 56">
                    <Input icon={<Smartphone className="h-5 w-5" />} inputMode="tel" placeholder="6XX XX XX XX" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, "").slice(0, 12))} />
                  </Field>
                  <div className="flex gap-3 rounded-2xl bg-sun/15 p-4 text-sm font-medium text-ink-soft">
                    <span className="text-xl">📲</span>
                    <p>En situation réelle, tu recevrais une demande de confirmation sur ton téléphone à valider avec ton code PIN. Ici, la validation est simulée.</p>
                  </div>
                </div>
              )}
              {method === "PAYPAL" && (
                <Field label="Email PayPal">
                  <Input type="email" value={paypal} onChange={(e) => setPaypal(e.target.value)} />
                </Field>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="mt-5 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{error}</p>}
          <Button size="lg" className="mt-6 w-full" onClick={pay} loading={pending}>
            {stage === "processing" ? "Traitement en cours…" : `Payer ${price}`}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted">
            <ShieldCheck className="h-4 w-4 text-mint" /> Garantie satisfait ou remboursé 14 jours
          </p>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden p-2.5">
          <CourseCover course={course} className="aspect-video rounded-[1.25rem]" />
          <div className="p-4">
            <p className="font-display text-lg font-extrabold leading-snug">{course.title}</p>
            <p className="text-sm text-muted">par {course.instructor}</p>
            <p className="mt-2 text-xs font-bold text-muted">
              {course.chapters} chapitres · {formatDuration(course.durationMinutes)} {course.certified && "· 🎓 certifiant"}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="text-sm font-bold text-muted">Devise</span>
              <div className="flex rounded-xl bg-surface-2 p-1">
                {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                  <button key={c} onClick={() => setCurrency(c)} className={cn("rounded-lg px-3 py-1.5 text-xs font-extrabold transition", currency === c ? "bg-surface text-brand shadow-sm" : "text-muted")}>
                    {CURRENCIES[c].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row k="Prix du cours" v={price} />
              <Row k="Frais" v="0" />
              <div className="flex items-center justify-between border-t border-dashed border-line pt-3">
                <span className="font-extrabold">Total</span>
                <span className="font-display text-2xl font-extrabold text-brand">{price}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}
