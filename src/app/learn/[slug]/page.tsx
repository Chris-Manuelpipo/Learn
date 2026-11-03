import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getLearnContext } from "@/lib/learn";

export default async function LearnIndex({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const ctx = await getLearnContext(slug, user.id);
  if (!ctx || !ctx.flat.length) redirect(`/courses/${slug}`);
  const next = ctx.flat.find((l) => !ctx.completed.has(l.id));
  redirect(`/learn/${slug}/${(next ?? ctx.flat[0]).id}`);
}
