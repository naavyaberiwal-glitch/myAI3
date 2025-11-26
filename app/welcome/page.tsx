// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);
  const [muted, setMuted] = useState<boolean>(false);
  const TARGET_VOLUME = 0.45; // final volume after fade-in
  const FADE_DURATION_MS = 1800; // fade-in length
  const FADE_STEP_MS = 60; // step frequency

  // Helper: clear any running fade timers
  const clearFadeInterval = () => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  // Start audio with gentle fade-in
  const startAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    clearFadeInterval();

    try {
      // Ensure audio is unmuted when starting (but respect user's muted toggle)
      audio.muted = false;
      audio.volume = 0;
      await audio.play();
      setAudioReady(true);
      setShowPlayPrompt(false);

      // fade to target volume
      const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_STEP_MS));
      const stepDelta = TARGET_VOLUME / steps;
      let currentStep = 0;

      fadeIntervalRef.current = window.setInterval(() => {
        currentStep += 1;
        const next = Math.min(TARGET_VOLUME, audio.volume + stepDelta);
        audio.volume = next;
        if (currentStep >= steps || audio.volume >= TARGET_VOLUME - 0.001) {
          clearFadeInterval();
          audio.volume = TARGET_VOLUME;
        }
      }, FADE_STEP_MS);
    } catch (err) {
      // Autoplay blocked — show play prompt
      setShowPlayPrompt(true);
    }
  };

  // Fade out then pause (used for mute)
  const fadeOutAndMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    clearFadeInterval();

    const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_STEP_MS));
    const stepDelta = (audio.volume || TARGET_VOLUME) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep += 1;
      const next = Math.max(0, (audio.volume || TARGET_VOLUME) - stepDelta);
      audio.volume = next;
      if (currentStep >= steps || audio.volume <= 0.001) {
        clearFadeInterval();
        audio.volume = 0;
        audio.pause();
        audio.muted = true;
      }
    }, FADE_STEP_MS);
  };

  // Toggle mute/unmute via button
  const handleToggleMute = async () => {
    const audio = audioRef.current;
    if (!audio) {
      // if audio element not ready yet, try to start it
      await startAudio();
      setMuted(false);
      return;
    }

    if (!muted) {
      // currently unmuted -> fade out & mute
      fadeOutAndMute();
      setMuted(true);
    } else {
      // currently muted -> start & fade in
      setMuted(false);
      await startAudio();
    }
  };

  // Try to autoplay on mount. If blocked, show play prompt.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = 0;

    audio
      .play()
      .then(() => {
        // start fade-in automatically if autoplay succeeded
        setAudioReady(true);
        setMuted(false);

        // fade in
        const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_STEP_MS));
        const stepDelta = TARGET_VOLUME / steps;
        let currentStep = 0;
        clearFadeInterval();
        fadeIntervalRef.current = window.setInterval(() => {
          currentStep += 1;
          const next = Math.min(TARGET_VOLUME, audio.volume + stepDelta);
          audio.volume = next;
          if (currentStep >= steps || audio.volume >= TARGET_VOLUME - 0.001) {
            clearFadeInterval();
            audio.volume = TARGET_VOLUME;
          }
        }, FADE_STEP_MS);
      })
      .catch(() => {
        setShowPlayPrompt(true);
      });

    return () => {
      clearFadeInterval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure audio is paused on unmount
  useEffect(() => {
    return () => {
      clearFadeInterval();
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.pause();
        } catch {}
      }
    };
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      {/* Decorative soft circles (no background image) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#DFF6E6] to-[#C9F0D1] opacity-60 blur-3xl" />
        <div className="absolute -right-32 -bottom-44 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F0FFF6] to-[#D9F7E4] opacity-55 blur-2xl" />
      </div>

      {/* Main Card */}
      <div
        className="relative z-10 w-full max-w-3xl mx-auto rounded-2xl py-10 px-8 md:px-16 shadow-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,255,245,0.70))",
          backdropFilter: "saturate(140%) blur(8px)",
          border: "1px solid rgba(24,32,20,0.06)",
        }}
      >
        <div className="flex flex-col items-center text-center gap-6">
          {/* Animated Logo — shimmering gradient around it */}
          <div className="relative animate-logo-lift">
            {/* shimmering ring */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full -z-10 animate-shimmer"
              style={{
                width: 160,
                height: 160,
                margin: "-20px auto 0",
                filter: "blur(20px)",
                opacity: 0.9,
              }}
            />
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/90 shadow-md">
              <Image
                src="/logo.png"
                alt="Greanly logo"
                width={92}
                height={92}
                className="object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight animate-fade-up">
            Greanly
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-neutral-700 text-base md:text-lg animate-fade-up delay-100">
            Your sustainability companion — smarter, simpler, actionable.
          </p>

          {/* Feature bullets */}
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl animate-fade-up delay-200">
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                •
              </span>
              <span>Reduce waste with practical steps</span>
            </li>

            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                •
              </span>
              <span>Find sustainable suppliers</span>
            </li>

            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                •
              </span>
              <span>Improve materials, packaging & sourcing</span>
            </li>
          </ul>

          {/* CTA Button */}
          <div className="mt-6 animate-fade-up delay-300">
            <button
              onClick={() => {
                // ensure audio starts (or unmute) when proceeding
                if (!audioReady) void startAudio();
                else if (muted) void handleToggleMute();
                router.push("/chat");
              }}
              className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-7 py-3 rounded-full shadow-lg transform transition active:scale-95"
            >
              <svg
                className="w-5 h-5 -ml-1"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              >
                <path d="M5 12h14" strokeLinecap="round" />
                <path d="M12 5l7 7-7 7" strokeLinecap="round" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">
        Built with care • AI + practical sustainability tips
      </div>

      {/* Ambient Audio (forest + river) — place ambient-forest.mp3 in /public */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" loop />

      {/* Fallback play prompt when autoplay blocked */}
      {showPlayPrompt && (
        <button
          onClick={startAudio}
          className="fixed bottom-20 right-6 z-50 inline-flex items-center gap-2 bg-white/90 text-slate-800 px-3 py-2 rounded-full shadow-md hover:scale-[1.03] transition"
        >
          🔊 Play ambience
        </button>
      )}

      {/* Mute/unmute button (persistent) */}
      <button
        aria-pressed={muted}
        aria-label={muted ? "Unmute ambience" : "Mute ambience"}
        onClick={handleToggleMute}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow-lg hover:scale-105 transition"
        style={{ backdropFilter: "blur(6px)" }}
      >
        {muted ? (
          <svg className="w-6 h-6 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 8c1.104 1.333 1.5 3.333 1.5 4s-.396 2.667-1.5 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 8a4 4 0 0 1 0 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5a8 8 0 0 1 0 14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Animations */}
      <style jsx>{`
        .animate-logo-lift {
          animation: lift 900ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
        }
        .animate-fade-up {
          opacity: 0;
          transform: translateY(12px);
          animation: fadeUp 700ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
        }
        .animate-fade-up.delay-100 {
          animation-delay: 120ms;
        }
        .animate-fade-up.delay-200 {
          animation-delay: 240ms;
        }
        .animate-fade-up.delay-300 {
          animation-delay: 360ms;
        }

        /* shimmering gradient ring under logo */
        @keyframes shimmer {
          0% {
            transform: scale(0.95) rotate(0deg);
            opacity: 0.55;
            filter: blur(24px);
            background-position: 0% 50%;
          }
          50% {
            transform: scale(1.03) rotate(10deg);
            opacity: 0.9;
            background-position: 100% 50%;
          }
          100% {
            transform: scale(0.95) rotate(0deg);
            opacity: 0.55;
            background-position: 0% 50%;
          }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, rgba(198,255,217,0.55), rgba(152,245,200,0.45), rgba(214,255,234,0.55));
          animation: shimmer 2800ms infinite ease-in-out;
        }

        @keyframes lift {
          from {
            transform: translateY(14px) scale(0.98);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
