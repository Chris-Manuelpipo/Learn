import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser } from "./auth";
import { isCurrency, type Currency } from "./currency";

export const CURRENCY_COOKIE = "learn_currency";

export async function getCurrency(): Promise<Currency> {
  const cookie = (await cookies()).get(CURRENCY_COOKIE)?.value;
  if (isCurrency(cookie)) return cookie;
  const user = await getCurrentUser();
  return user && isCurrency(user.currency) ? user.currency : "XAF";
}
