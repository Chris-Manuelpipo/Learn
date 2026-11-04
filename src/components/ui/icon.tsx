import {
  Award,
  Bell,
  BookOpen,
  Brain,
  BrainCircuit,
  Briefcase,
  CalendarCheck,
  CodeXml,
  Crown,
  Flag,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Inbox,
  Landmark,
  Languages,
  Library,
  Megaphone,
  MessageSquareQuote,
  Moon,
  Mountain,
  NotebookPen,
  Pencil,
  PenTool,
  Receipt,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Star,
  Sunrise,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { palette } from "@/lib/colors";

// Les catégories, badges et notifications stockent un nom d'icône en base.
const ICONS: Record<string, LucideIcon> = {
  award: Award,
  bell: Bell,
  "book-open": BookOpen,
  brain: Brain,
  "brain-circuit": BrainCircuit,
  briefcase: Briefcase,
  "calendar-check": CalendarCheck,
  code: CodeXml,
  crown: Crown,
  flag: Flag,
  flame: Flame,
  footprints: Footprints,
  gem: Gem,
  "graduation-cap": GraduationCap,
  inbox: Inbox,
  landmark: Landmark,
  languages: Languages,
  library: Library,
  megaphone: Megaphone,
  "message-square-quote": MessageSquareQuote,
  moon: Moon,
  mountain: Mountain,
  "notebook-pen": NotebookPen,
  pencil: Pencil,
  "pen-tool": PenTool,
  receipt: Receipt,
  rocket: Rocket,
  "shield-check": ShieldCheck,
  smartphone: Smartphone,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  sunrise: Sunrise,
  target: Target,
  "trending-up": TrendingUp,
  trophy: Trophy,
  "user-check": UserCheck,
};

export function Icon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Cmp = ICONS[name] ?? Sparkles;
  return <Cmp className={className} style={style} aria-hidden />;
}

/** Pastille carrée teintée contenant une icône (catégories, notifications…). */
export function IconTile({ name, color, size = 40, className }: { name: string; color?: string; size?: number; className?: string }) {
  const p = palette(color ?? "violet");
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl", className)}
      style={{ width: size, height: size, background: `color-mix(in srgb, ${p.from} 14%, transparent)`, color: `color-mix(in srgb, ${p.ink} 85%, var(--ink))` }}
    >
      <Icon name={name} className="h-[46%] w-[46%]" />
    </span>
  );
}
