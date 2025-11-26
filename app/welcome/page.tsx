// app/welcome/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function WelcomePage(): JSX.Element {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // true when audio is playing

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
        audio.volume = Math.min(TARGET_VOLUME, (audio.volume ?? 0) + stepAmount);
        if ((audio.volume ?? 0) >= TARGET_VOLUME - 0.001) {
          clearFade();
          audio.volume = TARGET_VOLUME;
        }
      } catch {
        clearFade();
      }
    }, FADE_STEP_MS);
  };

  // Attempt immediate play; if blocked, start on first user gesture.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // required attributes (use setAttribute for compatibility with TS DOM types)
    audio.loop = true;
    audio.setAttribute("playsinline", "");

    // start with very low volume (makes some autoplay succeed)
    audio.volume = 0;

    const startFadeAndMark = () => {
      fadeIn();
      setIsPlaying(true);
    };

    const tryPlayNow = async (): Promise<boolean> => {
      try {
        // try to play unmuted (modern browsers often block audible autoplay, but this is the attempt)
        await audio.play();
        startFadeAndMark();
        return true;
      } catch {
        return false;
      }
    };

    let installedHandler = false;
    const onFirstGesture = async () => {
      try {
        await audio.play();
        startFadeAndMark();
      } catch {
        // if still fails, do nothing — user can press play on UI (we don't provide explicit play UI here)
      } finally {
        if (installedHandler) {
          document.removeEventListener("pointerdown", onFirstGesture);
          installedHandler = false;
        }
      }
    };

    (async () => {
      const ok = await tryPlayNow();
      if (!ok) {
        // If autoplay blocked, wait for a single gesture (click/tap) to start audio.
        document.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
        installedHandler = true;
      }
    })();

    return () => {
      clearFade();
      try {
        audio.pause();
      } catch {}
      if (installedHandler) {
        document.removeEventListener("pointerdown", onFirstGesture);
        installedHandler = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // small toggle if you want to let user stop the ambience (keeps UI minimal)
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        fadeIn();
        setIsPlaying(true);
      } catch {
        // ignore
      }
    } else {
      try {
        audio.pause();
      } catch {}
      setIsPlaying(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      {/* decorative soft circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#DFF6E6] to-[#C9F0D1] opacity-60 blur-3xl" />
        <div className="absolute -right-32 -bottom-44 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F0FFF6] to-[#D9F7E4] opacity-55 blur-2xl" />
      </div>

      <div
        className="relative z-10 w-full max-w-3xl mx-auto rounded-2xl py-10 px-8 md:px-16 shadow-xl"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(245,255,245,0.70))",
          backdropFilter: "saturate(140%) blur(8px)",
          border: "1px solid rgba(24,32,20,0.06)",
        }}
      >
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative animate-logo-lift">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/90 shadow-md">
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
                // ensure audio is playing before navigation where possible
                const audio = audioRef.current;
                if (audio && audio.paused) {
                  void audio.play().catch(() => {});
                }
                router.push("/chat");
              }}
              className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-7 py-3 rounded-full shadow-lg transform transition active:scale-95"
            >
              <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden>
                <path d="M5 12h14" strokeLinecap="round" />
                <path d="M12 5l7 7-7 7" strokeLinecap="round" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">Built with care • AI + practical sustainability tips</div>

      {/* Ambient audio file — ensure /public/ambient-forest.mp3 exists */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* optional minimal playback toggle (small and not required) */}
      <button
        onClick={togglePlayback}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "Pause ambience" : "Play ambience"}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/90 shadow-lg hover:scale-105 transition"
        style={{ backdropFilter: "blur(6px)" }}
      >
        {isPlaying ? (
          <svg className="w-6 h-6 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 5L6 9H3v6h3l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 8a4 4 0 0 1 0 8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <style jsx>{`
        .animate-logo-lift { animation: lift 900ms cubic-bezier(0.2,0.9,0.2,1) both; }
        .animate-fade-up { opacity: 0; transform: translateY(12px); animation: fadeUp 700ms cubic-bezier(0.2,0.9,0.2,1) forwards; }
        .animate-fade-up.delay-100 { animation-delay: 120ms; }
        .animate-fade-up.delay-200 { animation-delay: 240ms; }
        .animate-fade-up.delay-300 { animation-delay: 360ms; }

        @keyframes lift { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
