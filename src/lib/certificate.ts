import "server-only";
import QRCode from "qrcode";
import { db } from "./db";

export function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function getCertificate(code: string) {
  return db.certificate.findUnique({
    where: { code },
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true, accentColor: true } },
      course: { include: { instructor: { select: { name: true, instructorVerified: true } }, category: true } },
    },
  });
}

export function verifyUrl(code: string) {
  return `${appUrl()}/verify/${code}`;
}

export async function qrSvg(code: string) {
  return QRCode.toString(verifyUrl(code), { type: "svg", margin: 0, color: { dark: "#16161a", light: "#00000000" } });
}
