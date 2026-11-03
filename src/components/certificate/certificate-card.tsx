import { LogoMark } from "@/components/layout/logo";
import { formatDate, formatDuration } from "@/lib/utils";

type Props = {
  code: string;
  name: string;
  course: string;
  category: string;
  instructor: string;
  durationMinutes: number;
  score: number;
  issuedAt: Date;
  qr: string;
};

/** Rendu HTML du certificat (le PDF reprend la même mise en page). */
export function CertificateCard(p: Props) {
  return (
    <div className="relative aspect-[1.414] w-full overflow-hidden rounded-[1.5rem] bg-[#fffdf7] text-[#16122b] shadow-[var(--shadow-pop)] ring-1 ring-black/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#efeaff_0,transparent_35%),radial-gradient(circle_at_100%_100%,#ffe8f3_0,transparent_35%)]" />
      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#c54bff] opacity-90" />
      <div className="absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-gradient-to-br from-[#ffc93d] to-[#ff5fa2] opacity-80" />
      <div className="absolute inset-[3.5%] rounded-[1rem] border-2 border-[#16122b]/10" />

      <div className="relative flex h-full flex-col px-[8%] py-[6%] text-center">
        <div className="flex items-center justify-center gap-2">
          <LogoMark size={28} />
          <span className="font-display text-xl font-extrabold">learn</span>
        </div>
        <p className="mt-[3%] text-[clamp(0.55rem,1.4vw,0.8rem)] font-extrabold uppercase tracking-[0.3em] text-[#6d4aff]">Certificat de réussite</p>
        <p className="mt-[2%] text-[clamp(0.6rem,1.4vw,0.9rem)] text-[#6e6a8a]">Ce certificat atteste que</p>
        <p className="mt-[1%] font-display text-[clamp(1.4rem,5vw,3.2rem)] font-extrabold leading-tight">{p.name}</p>
        <p className="mt-[1.5%] text-[clamp(0.6rem,1.4vw,0.9rem)] text-[#6e6a8a]">a suivi avec succès et réussi l'examen final du cours</p>
        <p className="mx-auto mt-[1%] max-w-[85%] font-display text-[clamp(0.9rem,2.6vw,1.7rem)] font-extrabold leading-snug text-[#4b2fd6]">{p.course}</p>
        <p className="mt-[1.5%] text-[clamp(0.55rem,1.2vw,0.8rem)] font-semibold text-[#6e6a8a]">
          {p.category} · {formatDuration(p.durationMinutes)} de formation · Score {p.score} %
        </p>

        <div className="mt-auto flex items-end justify-between gap-4 text-left">
          <div>
            <p className="font-display text-[clamp(0.8rem,2vw,1.3rem)] italic">{p.instructor}</p>
            <div className="my-1 h-px w-[clamp(5rem,16vw,11rem)] bg-[#16122b]/30" />
            <p className="text-[clamp(0.5rem,1.1vw,0.72rem)] font-bold text-[#6e6a8a]">Formateur</p>
          </div>
          <div className="grid h-[clamp(3.5rem,10vw,6rem)] w-[clamp(3.5rem,10vw,6rem)] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffc93d] to-[#ff9f1c] text-[clamp(1.4rem,4vw,2.6rem)] shadow-lg ring-4 ring-white">🎓</div>
          <div className="text-right">
            <div className="relative ml-auto box-content h-[clamp(3rem,8vw,5rem)] w-[clamp(3rem,8vw,5rem)] rounded-lg bg-white p-1.5 shadow-sm [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: p.qr }} />
            <p className="mt-1 font-mono text-[clamp(0.45rem,1vw,0.68rem)] font-bold">{p.code}</p>
            <p className="text-[clamp(0.45rem,1vw,0.68rem)] text-[#6e6a8a]">Délivré le {formatDate(p.issuedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
