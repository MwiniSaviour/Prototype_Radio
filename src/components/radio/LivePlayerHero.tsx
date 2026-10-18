"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { Show, ShowSlot, Weekday } from "@/lib/types";
import { resolveCurrentSlot } from "@/lib/resolveCurrentSlot";
import { cn } from "@/lib/utils";
import { formatClock, formatDayRange } from "@/lib/format";
import { siteConfig } from "@/lib/constants";
import { IconClock, IconPause, IconPlay, IconVolume, IconWaveform } from "@/components/ui/icons";
import { NowPlayingChip } from "./NowPlayingChip";
import { Waveform } from "./Waveform";

export interface LivePlayerHeroProps {
  show: Show;
  /** The slot the hero is representing: the current one when live, the next one when off air. */
  slot: { start: string; end: string } | null;
  isLive: boolean;
  className?: string;
}

/*
 * The stream URL is opt-in via env because embedding a broadcaster's feed on a
 * new domain has unresolved licensing/CDN-permission questions (see
 * docs/live-audio-backend-research.md §8–9). The player UI must work without it.
 */
const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL ?? "";

// One source for each player sentence: the toggle's preflight paths and the
// audio element's handlers must report identical copy.
const NOT_CONFIGURED_MESSAGE =
  "Live stream is not configured. Set NEXT_PUBLIC_STREAM_URL to enable playback.";
const START_FAILED_MESSAGE = "The live stream could not be started. Please try again.";
const UNREACHABLE_MESSAGE = "The live stream could not be reached. Please try again.";
const OFFLINE_MESSAGE = "You're offline — live radio needs a connection.";
const STREAM_CHECKLIST =
  "check Zeno embed rights for the ?embed=1 stream variant, Access-Control-Allow-Origin on the stream host, and the configured NEXT_PUBLIC_STREAM_URL (docs/live-audio-backend-research.md §4.6, §8.6)";

export function LivePlayerHero({ show, slot, isLive, className }: LivePlayerHeroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Marked when play() is requested so onPlaying can report time to first audio.
  const playRequestedAtRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [message, setMessage] = useState("");
  // Server markup and the first client render must agree, so `now` stays null
  // until after mount; schedule resolution then runs client-side only.
  const [now, setNow] = useState<Date | null>(null);

  const configured = STREAM_URL.length > 0;
  const days = formatDayRange(show.schedule.map((entry) => entry.day));
  const hostLine = show.hosts.map((host) => host.name).join(" & ") || siteConfig.name;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const scheduleByDay = useMemo<Record<Weekday, ShowSlot[]>>(() => {
    const schedule: Record<Weekday, ShowSlot[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
    for (const entry of show.schedule) {
      schedule[entry.day].push(entry);
    }
    return schedule;
  }, [show.schedule]);

  const resolution = useMemo(
    () => (now ? resolveCurrentSlot(scheduleByDay, now) : null),
    [now, scheduleByDay],
  );

  // The caller's slot/isLive stay as SSR and fallback sources so the schedule
  // line never blanks when the browser clock has not been read yet.
  const displaySlot = resolution ? ((resolution.live ?? resolution.next) ?? slot) : slot;
  const displayIsLive = resolution ? resolution.anchorIsLive : isLive;

  function logStreamDiagnostics(reason: string, error?: unknown) {
    const audio = audioRef.current;
    console.warn(`[live-radio] ${reason}`, {
      error: error ?? null,
      mediaErrorCode: audio?.error?.code ?? null,
      mediaErrorMessage: audio?.error?.message ?? null,
      networkState: audio?.networkState ?? null,
      readyState: audio?.readyState ?? null,
      streamUrl: STREAM_URL || null,
      online: navigator.onLine,
      checklist: STREAM_CHECKLIST,
    });
  }

  function togglePlayback() {
    if (!configured) {
      // No engine to drive, but the control must still reflect the user's intent
      // and tell them why nothing is audible.
      setPlaying((current) => !current);
      setMessage(NOT_CONFIGURED_MESSAGE);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (!navigator.onLine) {
        setPlaying(false);
        setMessage(OFFLINE_MESSAGE);
        return;
      }

      setMessage("");

      // Diagnostic-only: a CORS-failed HEAD preflight does not prove the stream
      // is unplayable, so this never gates playback.
      void fetch(STREAM_URL, { method: "HEAD", mode: "cors" })
        .then((response) => {
          if (!response.ok) {
            console.warn("[live-radio] stream preflight returned a non-OK status", {
              status: response.status,
              streamUrl: STREAM_URL,
              online: navigator.onLine,
              checklist: STREAM_CHECKLIST,
            });
            if (audioRef.current?.paused) setMessage(START_FAILED_MESSAGE);
          }
        })
        .catch((error: unknown) => {
          console.warn("[live-radio] stream preflight failed", {
            streamUrl: STREAM_URL,
            online: navigator.onLine,
          });
          if (audioRef.current?.paused) setMessage(START_FAILED_MESSAGE);
          logStreamDiagnostics("stream preflight failed", error);
        });

      playRequestedAtRef.current = Date.now();
      void audio.play().catch((error: unknown) => {
        setPlaying(false);
        setMessage(START_FAILED_MESSAGE);
        logStreamDiagnostics("audio.play() rejected", error);
      });
    } else {
      audio.pause();
    }
  }

  return (
    <section
      id="live-player"
      aria-labelledby="live-player-heading"
      className={cn(
        "relative isolate overflow-hidden rounded-card border border-white/10 bg-black text-white shadow-card",
        className,
      )}
    >
      <Image
        src={show.image.src}
        alt={show.image.alt}
        fill
        sizes="(max-width: 1279px) 100vw, 64vw"
        className="object-cover object-center opacity-60"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40"
      />

      <div className="relative flex min-h-[20rem] flex-col justify-between gap-8 p-5 sm:min-h-[22rem] sm:p-7">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/35 px-3 py-1 text-[0.6875rem] font-bold tracking-[0.18em] text-white">
            <IconWaveform className="h-4 w-4 text-brand" aria-hidden="true" />
            {displayIsLive ? "LIVE ON AIR" : "UP NEXT"}
          </p>
          <h1
            id="live-player-heading"
            className="mt-4 font-display text-4xl leading-[1.04] font-extrabold tracking-tight text-white sm:mt-5 sm:text-5xl"
          >
            {show.name}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-[0.9375rem]">
            {show.tagline}
          </p>
          {displaySlot ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/75 sm:text-sm">
              <IconClock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-medium tabular-nums">
                {formatClock(displaySlot.start)} – {formatClock(displaySlot.end)}
              </span>
              <span aria-hidden="true" className="text-white/40">
                |
              </span>
              <span>{days}</span>
            </p>
          ) : null}
        </div>

        <div>
          {/* The lg+ right padding reserves the corner the Now Playing chip
              absolutely positions into, so the waveform never runs under it. */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-4 lg:pr-56">
            <button
              type="button"
              aria-pressed={playing}
              aria-label={playing ? `Pause ${show.name} live stream` : `Play ${show.name} live stream`}
              onClick={togglePlayback}
              className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg shadow-pop transition-[background-color,transform] duration-200 hover:scale-105 hover:bg-brand-hover active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
            >
              {playing ? (
                <IconPause className="h-6 w-6" aria-hidden="true" />
              ) : (
                <IconPlay className="h-6 w-6 translate-x-px" aria-hidden="true" />
              )}
            </button>

            <Waveform playing={playing} className="max-w-md flex-1" />

            <span className="ml-auto flex items-center gap-2.5">
              <IconVolume className="h-5 w-5 shrink-0 text-white/75" aria-hidden="true" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label="Stream volume"
                onChange={(event) => setVolume(Number(event.target.value))}
                className="hidden h-1.5 w-24 cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:block"
              />
            </span>
          </div>

          <p role="status" className="mt-3 min-h-[1.125rem] text-xs leading-relaxed text-white/75">
            {message}
          </p>
        </div>

        <NowPlayingChip
          label={displayIsLive ? "Now playing" : "Next up"}
          title={show.name}
          artist={hostLine}
          image={show.image}
          className="mt-1 w-full sm:mt-0 sm:w-fit sm:self-end lg:absolute lg:right-7 lg:bottom-7"
        />
      </div>

      <audio
        ref={audioRef}
        src={STREAM_URL || undefined}
        preload="none"
        onPlay={() => {
          setPlaying(true);
          setMessage("");
        }}
        onPause={() => setPlaying(false)}
        onPlaying={() => {
          const requestedAt = playRequestedAtRef.current;
          if (requestedAt !== null) {
            console.info("[live-radio] time to first audio", {
              milliseconds: Date.now() - requestedAt,
            });
            playRequestedAtRef.current = null;
          }
        }}
        onError={() => {
          setPlaying(false);
          setMessage(UNREACHABLE_MESSAGE);
          logStreamDiagnostics("audio element error");
        }}
      />
    </section>
  );
}
