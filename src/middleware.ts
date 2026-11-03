import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { PALETTE_COOKIE, isPaletteName } from "@/lib/palettes";

const PROTECTED = ["/dashboard", "/learn", "/my-courses", "/profile", "/checkout", "/badges", "/studio", "/admin", "/become-instructor", "/notes", "/review"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const palette = req.nextUrl.searchParams.get("palette");
  if (isPaletteName(palette)) {
    const url = req.nextUrl.clone();
    url.searchParams.delete("palette");
    const res = NextResponse.redirect(url);
    res.cookies.set(PALETTE_COOKIE, palette, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/studio") && session.role === "STUDENT") {
      return NextResponse.redirect(new URL("/become-instructor", req.url));
    }
  }

  if ((pathname === "/login" || pathname === "/register") && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:png|jpg|svg|webp|ico|mp4)$).*)"],
};
