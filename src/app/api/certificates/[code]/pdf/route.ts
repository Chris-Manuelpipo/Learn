import { cookies } from "next/headers";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { DEFAULT_PALETTE, PALETTES, PALETTE_COOKIE, isPaletteName } from "@/lib/palettes";
import QRCode from "qrcode";
import { getCertificate, verifyUrl } from "@/lib/certificate";
import { formatDate, formatDuration } from "@/lib/utils";

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
// Les polices standard PDF ne couvrent que WinAnsi : on retire ce qui n'y est pas.
const safe = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await getCertificate(code);
  if (!cert) return new Response("Certificat introuvable", { status: 404 });

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificat Learn - ${cert.course.title}`);
  pdf.setAuthor("Learn");
  const page = pdf.addPage([842, 595]);
  const { width: W, height: H } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const saved = (await cookies()).get(PALETTE_COOKIE)?.value;
  const brand = PALETTES[isPaletteName(saved) ? saved : DEFAULT_PALETTE].light;
  const ink = hex("#16161a");
  const muted = hex("#6e6a8a");
  const accent = hex(brand.ink);

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: hex("#fffdf7") });
  page.drawCircle({ x: 0, y: H, size: 150, color: hex(brand.brand) });
  page.drawCircle({ x: 60, y: H - 20, size: 60, color: hex(brand.brand2), opacity: 0.6 });
  page.drawCircle({ x: W, y: 0, size: 170, color: hex("#ffc93d") });
  page.drawCircle({ x: W - 70, y: 30, size: 70, color: hex("#ff9f1c"), opacity: 0.7 });
  page.drawRectangle({ x: 28, y: 28, width: W - 56, height: H - 56, borderColor: hex("#e6e2f3"), borderWidth: 2 });

  const center = (text: string, y: number, font: typeof bold, size: number, color = ink) => {
    let s = size;
    while (font.widthOfTextAtSize(text, s) > W - 160 && s > 10) s -= 1;
    page.drawText(text, { x: (W - font.widthOfTextAtSize(text, s)) / 2, y, size: s, font, color });
  };

  // Logo
  page.drawRectangle({ x: W / 2 - 52, y: H - 95, width: 30, height: 30, color: accent });
  page.drawText("L", { x: W / 2 - 43, y: H - 87, size: 18, font: bold, color: rgb(1, 1, 1) });
  page.drawText("learn", { x: W / 2 - 14, y: H - 89, size: 22, font: bold, color: ink });

  center("CERTIFICAT DE RÉUSSITE", H - 135, bold, 13, accent);
  center("Ce certificat atteste que", H - 175, regular, 13, muted);
  center(safe(cert.user.name), H - 225, bold, 42);
  center("a suivi avec succès et réussi l'examen final du cours", H - 260, regular, 13, muted);
  center(safe(cert.course.title), H - 300, bold, 24, hex(brand.ink));
  center(safe(`${cert.course.category.name} - ${formatDuration(cert.course.durationMinutes)} de formation - Score ${cert.score} %`), H - 330, regular, 11, muted);

  // Signature
  page.drawText(safe(cert.course.instructor.name), { x: 90, y: 120, size: 20, font: italic, color: ink });
  page.drawLine({ start: { x: 90, y: 110 }, end: { x: 290, y: 110 }, thickness: 1, color: hex("#c9c4dc") });
  page.drawText("Formateur", { x: 90, y: 94, size: 10, font: bold, color: muted });

  // Sceau
  page.drawCircle({ x: W / 2, y: 120, size: 42, color: hex("#ffb52e"), borderColor: rgb(1, 1, 1), borderWidth: 4 });
  page.drawText("LEARN", { x: W / 2 - bold.widthOfTextAtSize("LEARN", 12) / 2, y: 124, size: 12, font: bold, color: rgb(1, 1, 1) });
  page.drawText("CERTIFIÉ", { x: W / 2 - bold.widthOfTextAtSize("CERTIFIÉ", 9) / 2, y: 110, size: 9, font: bold, color: rgb(1, 1, 1) });

  // QR + code, sur un fond qui le détache des formes décoratives
  page.drawRectangle({ x: W - 185, y: 62, width: 112, height: 128, color: hex("#fffdf7"), borderColor: hex("#e6e2f3"), borderWidth: 1 });
  const qr = await pdf.embedPng(await QRCode.toBuffer(verifyUrl(code), { margin: 1, width: 300, color: { dark: "#16161a", light: "#fffdf7" } }));
  page.drawImage(qr, { x: W - 175, y: 100, width: 80, height: 80 });
  page.drawText(code, { x: W - 175, y: 86, size: 9, font: bold, color: ink });
  page.drawText(safe(`Délivré le ${formatDate(cert.issuedAt)}`), { x: W - 175, y: 73, size: 8, font: regular, color: muted });
  center(safe(`Vérifiable sur ${verifyUrl(code)}`), 45, regular, 8, muted);

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificat-learn-${code}.pdf"`,
    },
  });
}
