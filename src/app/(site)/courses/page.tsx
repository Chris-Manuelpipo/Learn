import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCurrency } from "@/lib/currency-server";
import { Container } from "@/components/ui/section";
import { CourseCard, courseCardSelect } from "@/components/course/course-card";
import { CatalogFilters, CatalogSearch, CatalogSort, Pagination } from "@/components/course/catalog-filters";
import { EmptyState } from "@/components/ui/empty";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Catalogue des cours" };

const PER_PAGE = 12;
type SP = Record<string, string | undefined>;

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [user, currency, categories] = await Promise.all([
    getCurrentUser(),
    getCurrency(),
    db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { courses: { where: { status: "PUBLISHED" } } } } } }),
  ]);

  const where: Prisma.CourseWhereInput = { status: "PUBLISHED" };
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q, mode: "insensitive" } },
      { subtitle: { contains: sp.q, mode: "insensitive" } },
      { instructor: { name: { contains: sp.q, mode: "insensitive" } } },
      { category: { name: { contains: sp.q, mode: "insensitive" } } },
    ];
  }
  if (sp.category) where.category = { slug: { in: sp.category.split(",") } };
  if (sp.level) where.level = { in: sp.level.split(",") as ("BEGINNER" | "INTERMEDIATE" | "ADVANCED")[] };
  if (sp.price === "free") where.price = 0;
  if (sp.price === "paid") where.price = { gt: 0 };
  if (sp.certified === "1") where.certified = true;
  if (sp.duration === "short") where.durationMinutes = { lt: 120 };
  if (sp.duration === "medium") where.durationMinutes = { gte: 120, lte: 240 };
  if (sp.duration === "long") where.durationMinutes = { gt: 240 };
  if (sp.rating) where.ratingAvg = { gte: Number(sp.rating) };

  const orderBy: Prisma.CourseOrderByWithRelationInput[] =
    sp.sort === "rating"
      ? [{ ratingAvg: "desc" }, { ratingCount: "desc" }]
      : sp.sort === "newest"
        ? [{ publishedAt: "desc" }]
        : sp.sort === "price-asc"
          ? [{ price: "asc" }]
          : sp.sort === "price-desc"
            ? [{ price: "desc" }]
            : sp.sort === "short"
              ? [{ durationMinutes: "asc" }]
              : [{ featured: "desc" }, { studentsCount: "desc" }];

  const page = Math.max(1, Number(sp.page) || 1);
  const [total, courses, favorites] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({ where, orderBy, skip: (page - 1) * PER_PAGE, take: PER_PAGE, select: courseCardSelect }),
    user ? db.favorite.findMany({ where: { userId: user.id }, select: { courseId: true } }) : [],
  ]);
  const favSet = new Set(favorites.map((f) => f.courseId));
  const activeCategory = sp.category ? categories.find((c) => c.slug === sp.category) : null;

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-soft/70 to-transparent">
        <div className="bg-dots absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative py-12 sm:py-16">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-brand">{activeCategory ? `${activeCategory.icon} Catégorie` : "📚 Catalogue"}</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">{activeCategory ? activeCategory.name : sp.q ? `Résultats pour « ${sp.q} »` : "Trouve ton prochain cours"}</h1>
          <p className="mt-3 text-lg text-muted">{formatNumber(total)} cours pour apprendre à ton rythme, du grand débutant à l'expert.</p>
          <div className="mt-6 max-w-2xl">
            <CatalogSearch initial={sp.q ?? ""} />
          </div>
        </Container>
      </section>

      <Container className="grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <CatalogFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, count: c._count.courses }))} />
        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-muted">
              <span className="font-extrabold text-ink">{formatNumber(total)}</span> {total > 1 ? "cours trouvés" : "cours trouvé"}
            </p>
            <CatalogSort />
          </div>
          {courses.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} currency={currency} favorite={user ? favSet.has(c.id) : undefined} />
              ))}
            </div>
          ) : (
            <EmptyState emoji="🔎" title="Aucun cours ne correspond" text="Essaie d'élargir tes filtres ou une autre recherche. Il y a forcément un cours pour toi !" />
          )}
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} />
        </div>
      </Container>
    </div>
  );
}
