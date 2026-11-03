import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/** Efface une session devenue invalide puis renvoie vers la connexion. */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") ?? "/login";
  const target = to.startsWith("/") && !to.startsWith("//") ? to : "/login";
  const res = NextResponse.redirect(new URL(target, req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
