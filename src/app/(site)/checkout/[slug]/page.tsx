import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { Container } from "@/components/ui/section";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Paiement" };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/checkout/${slug}`);
  const course = await db.course.findUnique({
    where: { slug },
    include: { instructor: { select: { name: true } }, _count: { select: { chapters: true } } },
  });
  if (!course || course.status !== "PUBLISHED") notFound();
  if (course.price === 0) redirect(`/courses/${slug}`);
  const enrolled = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
  if (enrolled) redirect(`/learn/${slug}`);
  const currency = await getCurrency();

  return (
    <Container className="py-10 sm:py-14">
      <CheckoutForm
        course={{ id: course.id, slug: course.slug, title: course.title, color: course.color, coverUrl: course.coverUrl, price: course.price, instructor: course.instructor.name, chapters: course._count.chapters, durationMinutes: course.durationMinutes, certified: course.certified }}
        initialCurrency={currency}
        user={{ name: user.name, email: user.email }}
      />
    </Container>
  );
}
