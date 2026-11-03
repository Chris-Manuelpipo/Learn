"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { cn, formatClock } from "@/lib/utils";

export type PlayerHandle = { seek: (t: number) => void; time: () => number; pause: () => void };

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const VideoPlayer = forwardRef<PlayerHandle, { src: string; resumeAt?: number; onProgress?: (t: number, d: number) => void; onNearEnd?: () => void; onEnded?: () => void }>(
  function VideoPlayer({ src, resumeAt = 0, onProgress, onNearEnd, onEnded }, ref) {
    const video = useRef<HTMLVideoElement>(null);
    const box = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [muted, setMuted] = useState(false);
    const [full, setFull] = useState(false);
    const [idle, setIdle] = useState(false);
    const [flash, setFlash] = useState<string | null>(null);
    const nearEndFired = useRef(false);
    const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useImperativeHandle(ref, () => ({
      seek: (t) => {
        if (video.current) {
          video.current.currentTime = t;
          video.current.play();
        }
      },
      time: () => video.current?.currentTime ?? 0,
      pause: () => video.current?.pause(),
    }));

    const toggle = () => {
      const v = video.current;
      if (!v) return;
      if (v.paused) v.play();
      else v.pause();
      setFlash(v.paused ? "pause" : "play");
      setTimeout(() => setFlash(null), 450);
    };
    const skip = (s: number) => {
      if (video.current) video.current.currentTime = Math.max(0, Math.min(duration, video.current.currentTime + s));
    };
    const fullscreen = () => {
      if (!document.fullscreenElement) box.current?.requestFullscreen();
      else document.exitFullscreen();
    };
    const wake = () => {
      setIdle(false);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 2500);
    };

    useEffect(() => {
      const onFs = () => setFull(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", onFs);
      return () => document.removeEventListener("fullscreenchange", onFs);
    }, []);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (e.key === " " || e.key === "k") {
          e.preventDefault();
          toggle();
        } else if (e.key === "ArrowRight" || e.key === "l") skip(10);
        else if (e.key === "ArrowLeft" || e.key === "j") skip(-10);
        else if (e.key === "f") fullscreen();
        else if (e.key === "m") setMuted((m) => !m);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    });

    useEffect(() => {
      if (video.current) video.current.playbackRate = speed;
    }, [speed]);

    const pct = duration ? (time / duration) * 100 : 0;

    return (
      <div
        ref={box}
        className={cn("group relative overflow-hidden bg-black", full ? "h-full w-full" : "aspect-video w-full rounded-[1.5rem] shadow-[var(--shadow-pop)]", idle && playing && "cursor-none")}
        onMouseMove={wake}
        onMouseLeave={() => setIdle(true)}
      >
        <video
          ref={video}
          src={src}
          muted={muted}
          playsInline
          preload="metadata"
          className="h-full w-full"
          onClick={toggle}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            if (resumeAt > 3 && resumeAt < e.currentTarget.duration - 3) e.currentTarget.currentTime = resumeAt;
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            setTime(v.currentTime);
            if (v.buffered.length) setBuffered((v.buffered.end(v.buffered.length - 1) / (v.duration || 1)) * 100);
            onProgress?.(v.currentTime, v.duration);
            if (!nearEndFired.current && v.duration && v.currentTime / v.duration > 0.9) {
              nearEndFired.current = true;
              onNearEnd?.();
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            onEnded?.();
          }}
        />

        {!playing && !flash && (
          <button onClick={toggle} className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/50 via-black/10 to-black/20" aria-label="Lire">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 text-brand shadow-2xl transition hover:scale-110 sm:h-24 sm:w-24">
              <Play className="ml-1.5 h-9 w-9 fill-current sm:h-10 sm:w-10" />
            </span>
          </button>
        )}
        {flash && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-black/50 text-white">{flash === "play" ? <Play className="ml-1 h-8 w-8 fill-current" /> : <Pause className="h-8 w-8 fill-current" />}</span>
          </span>
        )}

        <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-12 text-white transition-opacity sm:px-5", playing && idle ? "opacity-0" : "opacity-100")}>
          <div
            className="group/bar relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/25 transition-all hover:h-2.5"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              if (video.current) video.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
            }}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-grad-a to-grad-b" style={{ width: `${pct}%` }} />
            <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow transition group-hover/bar:scale-100" style={{ left: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Ctrl onClick={toggle} label={playing ? "Pause" : "Lecture"}>{playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}</Ctrl>
            <Ctrl onClick={() => skip(-10)} label="Reculer de 10 s"><RotateCcw className="h-5 w-5" /></Ctrl>
            <Ctrl onClick={() => skip(10)} label="Avancer de 10 s"><RotateCw className="h-5 w-5" /></Ctrl>
            <Ctrl onClick={() => setMuted(!muted)} label={muted ? "Activer le son" : "Couper le son"}>{muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</Ctrl>
            <span className="ml-1 text-xs font-bold tabular-nums sm:text-sm">
              {formatClock(time)} <span className="text-white/60">/ {formatClock(duration)}</span>
            </span>
            <button
              onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
              className="ml-auto rounded-lg bg-white/15 px-2.5 py-1 text-xs font-extrabold transition hover:bg-white/25"
              aria-label="Vitesse de lecture"
            >
              {speed}×
            </button>
            <Ctrl onClick={fullscreen} label="Plein écran">{full ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}</Ctrl>
          </div>
        </div>
      </div>
    );
  },
);

function Ctrl({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="grid h-9 w-9 place-items-center rounded-lg transition hover:bg-white/15" aria-label={label} title={label}>
      {children}
    </button>
  );
}
