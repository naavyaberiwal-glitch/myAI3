// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const [muted, setMuted] = useState(true); // start muted so browsers allow autoplay
  const [unmuteNeeded, setUnmuteNeeded] = useState(false);

  const TARGET_VOLUME = 0.36;
  const FADE_DURATION_MS = 1400;
  const FADE_STEP_MS = 60;

  const clearFade = () => {
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const fadeIn = () => {
    const audio = audioRef.current;
    if (!audio) return;
    clearFade();
    const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_STEP_MS));
    const stepAmount = TARGET_VOLUME / steps;
    fadeIntervalRef.current = window.setInterval(() => {
      try {
        audio.volume = Math.min(TARGET_VOLUME, (audio.volume || 0) + stepAmount);
        if (audio.volume >= TARGET_VOLUME - 0.001) {
          clearFade();
          audio.volume = TARGET_VOLUME;
        }
      } catch {
        clearFade();
      }
    }, FADE_STEP_MS);
  };

  // Best-effort start autoplay muted, then attempt to unmute.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.playsInline = true;

    const start = async () => {
      try {
        audio.muted = true;
        audio.volume = 0;
        // allow autoplay (muted)
        await audio.play();
        fadeIn();

        // after fade, try to unmute programmatically (may still be blocked)
        setTimeout(() => {
          try {
            audio.muted = false;
            if (!audio.muted) {
              setMuted(false);
              setUnmuteNeeded(false);
            } else {
              setMuted(true);
              setUnmuteNeeded(true);
            }
          } catch {
            setMuted(true);
            setUnmuteNeeded(true);
          }
        }, FADE_DURATION_MS + 200);
      } catch {
        // playback failed; show unmute control so user can start audio
        setUnmuteNeeded(true);
        setMuted(true);
      }
    };

    start();

    return () => {
      clearFade();
      try {
        audio.pause();
      } catch {}
    };
  }, []);

  const handleToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted) {
      try {
        await audio.play();
        audio.muted = false;
        audio.volume = TARGET_VOLUME;
        setMuted(false);
        setUnmuteNeeded(false);
      } catch {
        // still blocked: show unmute needed
        setUnmuteNeeded(true);
        setMuted(true);
      }
    } else {
      audio.muted = true;
      setMuted(true);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      {/* soft decorative circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#DFF6E6] to-[#C9F0D1] opacity-60 blur-3xl" />
        <div className="absolute -right-32 -bottom-44 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F0FFF6] to-[#D9F7E4] opacity-55 blur-2xl" />
      </div>

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
          <div className="relative animate-logo-lift">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-full -z-10 shimmer-ring"
              style={{ width: 168, height: 168 }}
            />
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/90 shadow-md">
              {/* plain img (safer for SSR/build while debugging) */}
              <img src="/logo.png" alt="Greanly logo" width={92} height={92} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight animate-fade-up">Greanly</h1>
          <p className="max-w-2xl text-neutral-700 text-base md:text-lg animate-fade-up delay-100">
            Your sustainability companion — smarter, simpler, actionable.
          </p>

          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl animate-fade-up delay-200">
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">•</span>
              <span>Reduce waste with practical steps</span>
            </li>
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">•</span>
              <span>Find sustainable suppliers</span>
            </li>
            <li className="text-sm text-slate-700/90 flex items-start gap-3">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-semibold">•</span>
              <span>Improve materials, packaging & sourcing</span>
            </li>
          </ul>

          <div className="mt-6 animate-fade-up delay-300">
            <button
              onClick={() => {
                const audio = audioRef.current;
                if (audio && audio.paused) {
                  void audio.play().catch(() => {});
                }
                router.push("/chat");
              }}
              className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-7 py-3 rounded-full shadow-lg transform transition active:scale-95"
            >
              <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M5 12h14" strokeLinecap="round" />
                <path d="M12 5l7 7-7 7" strokeLinecap="round" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">Built with care • AI + practical sustainability tips</div>

      {/* Ambient audio file — place /public/ambient-forest.mp3 */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" autoPlay loop />

      {/* compact unmute toggle */}
      <button
        onClick={handleToggle}
        aria-pressed={!muted}
        aria-label={muted ? "Unmute ambient" : "Mute ambient"}
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

      <style jsx>{`
        .animate-logo-lift { animation: lift 900ms cubic-bezier(0.2,0.9,0.2,1) both; }
        .animate-fade-up { opacity: 0; transform: translateY(12px); animation: fadeUp 700ms cubic-bezier(0.2,0.9,0.2,1) forwards; }
        .animate-fade-up.delay-100 { animation-delay: 120ms; }
        .animate-fade-up.delay-200 { animation-delay: 240ms; }
        .animate-fade-up.delay-300 { animation-delay: 360ms; }

        .shimmer-ring {
          background: radial-gradient(circle at 30% 30%, rgba(165,255,205,0.95) 0%, rgba(165,255,205,0.6) 18%, rgba(255,255,255,0.02) 60%);
          filter: blur(28px);
          opacity: 0.95;
          animation: shimmerScale 3200ms ease-in-out infinite;
        }

        @keyframes shimmerScale {
          0% { transform: scale(0.96) rotate(0deg); opacity: 0.75; }
          50% { transform: scale(1.03) rotate(7deg); opacity: 1; }
          100% { transform: scale(0.96) rotate(0deg); opacity: 0.75; }
        }

        @keyframes lift { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
