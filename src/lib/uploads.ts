import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Enregistre une image envoyée par formulaire et renvoie son URL publique, ou une erreur lisible. */
export async function saveImage(file: FormDataEntryValue | null, prefix: string, maxMb = 3): Promise<{ url?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return {};
  const ext = TYPES[file.type];
  if (!ext) return { error: "Image PNG, JPG ou WebP uniquement." };
  if (file.size > maxMb * 1024 * 1024) return { error: `Image trop lourde (${maxMb} Mo maximum).` };
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${prefix}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/api/uploads/${name}` };
}
