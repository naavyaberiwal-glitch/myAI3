// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";

export default function Page() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);

  const [leavesMounted, setLeavesMounted] = useState(false);
  const [leavesActive, setLeavesActive] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const AUDIO_MS = 3000;
  const LEAVES_MS = 1500;

  const clearFade = () => {
    if (fadeRef.current) {
      window.clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  };

  const fadeOutAudio = useCallback((duration = 600) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const start = Math.max(0, Math.min(1, audio.volume || 0.36));
      const steps = Math.max(6, Math.ceil(duration / 40));
      let step = 0;
      clearFade();
      fadeRef.current = window.setInterval(() => {
        step++;
        const t = step / steps;
        audio.volume = Number((start * (1 - t)).toFixed(3));
        if (step >= steps) {
          clearFade();
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = start;
            audio.loop = false;
          } catch {}
        }
      }, Math.round(duration / steps));
    } catch {
      try { audio.pause(); audio.currentTime = 0; } catch {}
      clearFade();
    }
  }, []);

  const handleGetStarted = async () => {
    // audio playback on user gesture
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.36;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {
      /* ignore - continue */
    }

    // mount leaves container then activate for a short run
    setLeavesMounted(true);
    // slight delay for CSS paint
    setTimeout(() => setLeavesActive(true), 90);

    // hide leaves after their animation finishes
    setTimeout(() => {
      setLeavesActive(false);
      setTimeout(() => setLeavesMounted(false), 420);
    }, LEAVES_MS + 300);

    // stop audio (fade) and navigate with a gentle page fade
    setTimeout(() => {
      try { fadeOutAudio(600); } catch {}
      setTimeout(() => {
        setNavigating(true);
        // match CSS transition delay
        setTimeout(() => router.push("/chat"), 520);
      }, 420);
    }, AUDIO_MS);
  };

  // 12 leaves, empty spans (no emoji text)
  const leaves = Array.from({ length: 12 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ["--i" as any]: i }} />
  ));

  return (
    <main className={`min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-emerald-50 to-white ${navigating ? "page-exit" : ""}`}>
      {/* subtle background depth */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4FFF8] to-white opacity-95" />
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-tr from-[#DFF6E6] to-transparent opacity-60 blur-3xl" />
        <div className="absolute -right-28 -bottom-28 w-80 h-80 rounded-full bg-gradient-to-br from-[#E8FFF1] to-transparent opacity-60 blur-2xl" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl p-12 md:p-14 bg-white/95 backdrop-blur-md border border-emerald-900/6 shadow-xl transition-transform duration-400 ease-out"
        style={{ transform: "translateZ(0)" }}
      >
        {/* rim glow */}
        <div aria-hidden style={{
          position: "absolute",
          inset: -2,
          borderRadius: 16,
          pointerEvents: "none",
          boxShadow: "0 18px 60px rgba(6,95,70,0.06) inset",
          zIndex: -1
        }} />

        <div className="flex flex-col items-center text-center gap-6">
          {/* logo */}
          <div className="relative w-28 h-28 rounded-full grid place-items-center bg-white shadow-md border border-emerald-100">
            <img src="/logo.png" alt="Greanly logo" width={88} height={88} />
            <div aria-hidden className="absolute -inset-3 rounded-full border border-emerald-200/40" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Welcome to Greanly</h1>

          <p className="max-w-2xl text-slate-700 text-lg md:text-xl leading-relaxed">
            Practical, measurable sustainability insights — with instant steps your business can take today.
          </p>

          <div className="mt-6">
            <button
              onClick={handleGetStarted}
              className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-lg transform transition active:scale-95"
            >
              <span className="inline-block w-5">➜</span>
              Get Started
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-600/80 z-10">Built with care • AI + Sustainability</div>

      {/* audio */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves mounted only when needed */}
      {leavesMounted && (
        <div className={`leaves-overlay ${leavesActive ? "active" : ""}`} aria-hidden>
          {leaves}
        </div>
      )}

      <style jsx>{`
        /* page exit animation */
        .page-exit { animation: pageExit 520ms ease forwards; }
        @keyframes pageExit {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px) scale(0.998); }
        }

        /* leaves overlay */
        .leaves-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          pointer-events: none;
          overflow: hidden;
          opacity: 0;
          transition: opacity 240ms ease;
        }
        .leaves-overlay.active { opacity: 1; }

        /* leaf basic (empty span, CSS pseudo draws the leaf) */
        .leaf {
          position: absolute;
          top: -10%;
          left: calc(var(--i) * 8%);
          width: 18px;
          height: 12px;
          transform-origin: center;
          opacity: 0;
          animation: leafFall ${LEAVES_MS}ms cubic-bezier(.15,.9,.35,1) forwards;
          animation-delay: calc(var(--i) * 55ms);
        }

        .leaf::before {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%;
          transform: rotate(-18deg);
          background: linear-gradient(160deg, rgba(34,139,34,0.95), rgba(94,212,134,0.92));
          box-shadow: 0 6px 10px rgba(8,20,12,0.06);
        }
        .leaf::after {
          content: "";
          position: absolute;
          left: 46%;
          top: 18%;
          width: 1px;
          height: 60%;
          background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(0,0,0,0.06));
          transform: rotate(-16deg);
          opacity: 0.95;
        }

        .leaf:nth-child(3n) { width: 22px; height: 14px; }
        .leaf:nth-child(4n) { width: 14px; height: 10px; }

        @keyframes leafFall {
          0% {
            opacity: 0;
            transform: translateY(-8vh) translateX(0) rotate(-8deg) scale(0.9);
          }
          15% {
            opacity: 0.96;
            transform: translateY(8vh) translateX(2.2vw) rotate(6deg) scale(1.05);
          }
          60% {
            opacity: 1;
            transform: translateY(60vh) translateX(10vw) rotate(180deg) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translateY(120vh) translateX(22vw) rotate(420deg) scale(0.94);
          }
        }

        /* small screens */
        @media (max-width: 640px) {
          .leaf { left: calc(var(--i) * 6%); }
        }
      `}</style>
    </main>
  );
}
