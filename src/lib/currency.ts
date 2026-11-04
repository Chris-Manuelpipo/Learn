export const CURRENCIES = {
  XAF: { label: "FCFA", name: "Franc CFA", rate: 1, decimals: 0 },
  EUR: { label: "€", name: "Euro", rate: 655.957, decimals: 2 },
  USD: { label: "$", name: "Dollar US", rate: 600, decimals: 2 },
} as const;

export type Currency = keyof typeof CURRENCIES;

export function isCurrency(c: unknown): c is Currency {
  return typeof c === "string" && c in CURRENCIES;
}

export function convert(amountXaf: number, currency: Currency) {
  const c = CURRENCIES[currency];
  const raw = amountXaf / c.rate;
  return c.decimals ? Math.round(raw * 100) / 100 : Math.round(raw);
}

export function formatPrice(amountXaf: number, currency: Currency = "XAF") {
  if (amountXaf === 0) return "Gratuit";
  const value = convert(amountXaf, currency);
  if (currency === "XAF") return `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}
