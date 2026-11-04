import Link from "next/link";
import { BadgeCheck, Clock, GraduationCap, PlayCircle, Users } from "lucide-react";
import { CourseCover } from "./course-cover";
import { FavoriteButton } from "./favorite-button";
import { Stars } from "@/components/ui/stars";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";
import { formatPrice, type Currency } from "@/lib/currency";
import { formatDuration, formatNumber, LEVEL_LABEL } from "@/lib/utils";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  color: string;
  coverUrl: string | null;
  level: keyof typeof LEVEL_LABEL;
  price: number;
  certified: boolean;
  durationMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  studentsCount: number;
  instructor: { name: string; instructorVerified: boolean };
  category: { name: string; color: string };
  _count?: { chapters: number };
};

export function CourseCard({ course, currency, favorite, progress, href }: { course: CourseCardData; currency: Currency; favorite?: boolean; progress?: number; href?: string }) {
  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
      <Link href={href ?? `/courses/${course.slug}`} className="absolute inset-0 z-10" aria-label={course.title} />
      <div className="relative p-2.5 pb-0">
        <CourseCover course={course} className="aspect-[16/10] rounded-[1.25rem]" />
        <div className="absolute left-5 top-5 z-20 flex gap-1.5">
          {course.certified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#16161a] shadow-sm">
              <GraduationCap className="h-3.5 w-3.5" /> Certifiant
            </span>
          )}
        </div>
        {favorite !== undefined && (
          <div className="absolute right-5 top-5 z-20">
            <FavoriteButton courseId={course.id} initial={favorite} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="mb-2 flex items-center gap-2">
          <Pill color={course.category.color}>{course.category.name}</Pill>
          <span className="text-xs font-semibold text-muted">{LEVEL_LABEL[course.level]}</span>
        </div>
        <h3 className="line-clamp-2 text-[1.05rem] font-bold leading-snug">{course.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted">
          {course.instructor.name}
          {course.instructor.instructorVerified && <BadgeCheck className="h-4 w-4 text-brand" aria-label="Formateur certifié" />}
        </p>

        {progress !== undefined ? (
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex justify-between text-xs font-bold">
              <span className="text-muted">Progression</span>
              <span className={progress === 100 ? "text-brand-ink" : "text-brand"}>{progress} %</span>
            </div>
            <ProgressBar value={progress} color={progress === 100 ? "var(--brand)" : undefined} />
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center gap-1.5 text-sm">
              <span className="font-semibold text-ink-soft">{course.ratingAvg ? course.ratingAvg.toFixed(1) : "Nouveau"}</span>
              {course.ratingAvg > 0 && <Stars value={course.ratingAvg} size={13} />}
              {course.ratingCount > 0 && <span className="text-xs text-muted">({formatNumber(course.ratingCount)})</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(course.durationMinutes)}
              </span>
              {course._count && (
                <span className="inline-flex items-center gap-1">
                  <PlayCircle className="h-3.5 w-3.5" /> {course._count.chapters} chapitres
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {formatNumber(course.studentsCount)}
              </span>
            </div>
            <div className="mt-auto flex items-end justify-between pt-4">
              <span className={course.price === 0 ? "whitespace-nowrap text-lg font-bold text-brand-ink" : "whitespace-nowrap text-lg font-bold"}>{formatPrice(course.price, currency)}</span>
              <span className="translate-x-2 text-sm font-semibold text-brand-ink opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">Découvrir →</span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export const courseCardSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  color: true,
  coverUrl: true,
  level: true,
  price: true,
  certified: true,
  durationMinutes: true,
  ratingAvg: true,
  ratingCount: true,
  studentsCount: true,
  instructor: { select: { name: true, instructorVerified: true } },
  category: { select: { name: true, color: true } },
  _count: { select: { chapters: true } },
} as const;
