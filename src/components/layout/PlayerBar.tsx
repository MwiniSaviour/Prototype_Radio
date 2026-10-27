"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Show } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/format";
import { siteConfig } from "@/lib/constants";
import { IconChevronRight, IconPause, IconPlay, IconVolume, IconWaveform } from "@/components/ui/icons";
import { Container } from "@/components/ui/Container";
import { Waveform } from "@/components/radio/Waveform";

/*
 * The stream URL is opt-in via env because licensing/CDN permission is still
 * unresolved (docs/live-audio-backend-research.md §8–9). The bar must work
 * without it: pressing play reflects intent and says why nothing is audible.
 */
const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL ?? "";

/** mm:ss elapsed, for the on-air position readout. */
function elapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * The persistent player bar. It sits at the foot of every page (the wireframe's
 * docked strip), so the live stream is always one tap away regardless of which
 * story the reader is in.
 */
export function PlayerBar({
  currentShow,
  nextShow,
}: {
  currentShow: Show | null;
  nextShow: { show: Show; slot: { start: string; end: string } } | null;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");

  const configured = STREAM_URL.length > 0;
  const show = currentShow ?? nextShow?.show ?? null;
  const slot = currentShow ? currentShow.schedule[0] : nextShow?.slot ?? null;
  const programLine = currentShow
    ? `Live broadcast · ${currentShow.name}`
    : nextShow
      ? `Off air · back at ${formatClock(nextShow.slot.start)}`
      : "Off air";

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  function toggle() {
    if (!configured) {
      setPlaying((value) => !value);
      setMessage("Live stream is not configured. Set NEXT_PUBLIC_STREAM_URL to enable playback.");
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setMessage("");
      void audio.play().catch(() => {
        setPlaying(false);
        setMessage("The live stream could not be started. Please try again.");
      });
    } else {
      audio.pause();
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90"
      aria-label="Live radio player"
    >
      <Container className="flex h-[62px] items-center gap-3 sm:gap-6">
        {/* Station lock-up */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[3px] bg-brand-soft text-brand"
          >
            <IconWaveform className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] leading-none font-bold tracking-[0.14em] text-ink uppercase">
              {siteConfig.name}
            </p>
            <p className="mt-1 truncate text-[11.5px] leading-none text-muted">{programLine}</p>
          </div>
        </div>

        {/* Transport */}
        <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={playing}
            aria-label={playing ? "Pause live radio" : "Play live radio"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition-[transform,background-color] duration-150 hover:bg-brand-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:h-10 sm:w-10"
          >
            {playing ? (
              <IconPause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <IconPlay className="h-4 w-4 translate-x-px" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            aria-label="Skip to the next programme"
            className="hidden h-8 w-8 items-center justify-center text-ink/70 transition-colors hover:text-ink sm:grid"
            onClick={() => setMessage("One continuous live stream — there is nothing to skip to.")}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 6.5 13 12l-8 5.5zM16.5 6.5 21 12l-4.5 5.5z" />
              <path d="M21 5.5v13" opacity="0.5" />
            </svg>
          </button>

          <Waveform
            playing={playing}
            className="hidden max-w-[26rem] flex-1 text-brand/70 sm:block"
          />

          <span className="hidden shrink-0 text-[10.5px] tabular-nums text-muted sm:block">
            {configured && playing ? elapsed(seconds) : slot ? `${formatClock(slot.start)} – ${formatClock(slot.end)}` : ""}
          </span>
        </div>

        {/* Status + output */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-ink uppercase">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
            Live
          </span>

          <span className="hidden items-center gap-2 lg:flex">
            <IconVolume className="h-4 w-4 text-ink/70" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Volume"
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1 w-28 cursor-pointer accent-brand"
            />
          </span>

          <Link
            href="/shows#schedule"
            aria-label="Open the full schedule"
            className="grid h-8 w-8 place-items-center text-ink/60 transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h10M4 17h13" />
            </svg>
          </Link>

          <Link
            href="/shows"
            aria-label="Open the radio page"
            className="grid h-8 w-8 place-items-center text-ink/60 transition-colors hover:text-ink"
          >
            <IconChevronRight className="h-[18px] w-[18px] -rotate-90" aria-hidden="true" />
          </Link>
        </div>
      </Container>

      {message ? (
        <p
          role="status"
          className={cn(
            "border-t border-line bg-surface px-4 py-1.5 text-center text-[11px] leading-snug text-muted",
          )}
        >
          {message}
        </p>
      ) : null}

      <audio
        ref={audioRef}
        src={STREAM_URL || undefined}
        preload="none"
        onPlay={() => {
          setPlaying(true);
          setMessage("");
        }}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false);
          setMessage("The live stream could not be reached. Please try again.");
        }}
      />

      {/* The strip is fixed, so the page reserves its height to stay clear of it. */}
      <span aria-hidden="true" className="sr-only">
        {show ? `Now on ${siteConfig.name}: ${show.name}` : ""}
      </span>
    </div>
  );
}
