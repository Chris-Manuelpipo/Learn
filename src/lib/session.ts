import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "learn_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type SessionPayload = { sub: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" };

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
