// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // timings (ms)
  const AUDIO_PLAY_MS = 3000; // play 3 seconds
  const LEAVES_DURATION_MS = 1400; // how long leaf fall animation lasts
  const LEAVES_SHOW_DELAY = 120; // slight delay before showing leaves after click

  const [leavesActive, setLeavesActive] = useState(false);
  const [leavesMounted, setLeavesMounted] = useState(false);

  const clearFadeInterval = () => {
    if (fadeIntervalRef.current) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  };

  const fadeOutAudio = useCallback((duration = 600) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      const startVol = Math.max(0, Math.min(1, audio.volume || 0.36));
      const steps = Math.max(4, Math.ceil(duration / 50));
      let step = 0;
      clearFadeInterval();

      fadeIntervalRef.current = window.setInterval(() => {
        step++;
        const fraction = step / steps;
        const newVol = Math.max(0, startVol * (1 - fraction));
        audio.volume = Number(newVol.toFixed(3));
        if (step >= steps) {
          clearFadeInterval();
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = startVol; // restore nominal volume for next play
            audio.loop = false;
          } catch {}
        }
      }, Math.round(duration / steps));
    } catch {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
      clearFadeInterval();
    }
  }, []);

  const handleGetStarted = async () => {
    // play audio on gesture
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.36;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {
      // ignore
    }

    // mount leaves container first (so CSS + DOM exist), then activate with small delay
    setLeavesMounted(true);
    window.setTimeout(() => setLeavesActive(true), LEAVES_SHOW_DELAY);

    // hide leaves after their duration to keep UI clean
    window.setTimeout(() => {
      setLeavesActive(false);
      // unmount after animation ends
      window.setTimeout(() => setLeavesMounted(false), 400);
    }, LEAVES_DURATION_MS + 300);

    // wait for audio snippet, then fade out and navigate
    window.setTimeout(() => {
      try {
        if (audioRef.current) fadeOutAudio(600);
      } catch {}
      // navigate shortly after fade-out begins (ensures fade plays)
      window.setTimeout(() => {
        router.push("/chat");
      }, 700);
    }, AUDIO_PLAY_MS);
  };

  // render empty leaf spans (no emoji content)
  const leaves = Array.from({ length: 14 }).map((_, i) => (
    <span
      key={i}
      className="leaf"
      style={{ ['--i' as any]: i }}
      aria-hidden
    />
  ));

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
      {/* background decorative circles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-40 -top-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#DFF6E6] to-[#C9F0D1] opacity-60 blur-3xl" />
        <div className="absolute -right-32 -bottom-44 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#F0FFF6] to-[#D9F7E4] opacity-55 blur-2xl" />
      </div>

      {/* card */}
      <div
        className="relative z-10 w-full max-w-3xl mx-auto rounded-2xl py-10 px-8 md:px-16 shadow-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,255,245,0.78))",
          backdropFilter: "saturate(140%) blur(6px)",
          border: "1px solid rgba(24,32,20,0.06)",
        }}
      >
        <div className="flex flex-col items-center text-center gap-6">
          {/* logo */}
          <div className="relative animate-logo-lift">
            <div aria-hidden className="absolute -inset-6 rounded-full -z-10 shimmer-ring" style={{ width: 168, height: 168 }} />
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white/90 shadow-md">
              <img src="/logo.png" alt="Greanly logo" width={92} height={92} />
            </div>
          </div>

          {/* hero */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">Greanly</h1>
          <p className="max-w-2xl text-neutral-700 text-base md:text-lg">
            Make your business greener — practical, measurable steps that save money and reduce waste.
          </p>

          {/* three benefit tiles */}
          <div className="mt-4 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-3 p-4 rounded-md bg-white/50 border border-transparent">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
              <div className="text-sm text-slate-700">Cut costs & waste with practical steps</div>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-md bg-white/50 border border-transparent">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">🔎</div>
              <div className="text-sm text-slate-700">Find sustainable suppliers & materials</div>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-md bg-white/50 border border-transparent">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700">⚙️</div>
              <div className="text-sm text-slate-700">Simple action plans (30/60/90 days)</div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6">
            <button
              onClick={handleGetStarted}
              className="get-started inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-7 py-3 rounded-full shadow-lg transform transition active:scale-95"
              aria-label="Get Started with Greanly"
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

      {/* audio (will be triggered by the click) */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves overlay: mounted only when needed to avoid any initial paint issues */}
      {leavesMounted && (
        <div className={`leaves-overlay ${leavesActive ? "active" : ""}`} aria-hidden>
          {leaves}
        </div>
      )}

      <style jsx>{`
        .get-started:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 18px 40px rgba(16, 185, 129, 0.18), 0 6px 18px rgba(16, 185, 129, 0.06);
        }

        .animate-logo-lift { animation: lift 900ms cubic-bezier(0.2,0.9,0.2,1) both; }
        .shimmer-ring { background: radial-gradient(circle at 30% 30%, rgba(165,255,205,0.95) 0%, rgba(165,255,205,0.6) 18%, rgba(255,255,255,0.02) 60%); filter: blur(28px); opacity: 0.95; animation: shimmerScale 3200ms ease-in-out infinite; }
        @keyframes shimmerScale { 0% { transform: scale(0.96) rotate(0deg); opacity: 0.75; } 50% { transform: scale(1.03) rotate(7deg); opacity: 1; } 100% { transform: scale(0.96) rotate(0deg); opacity: 0.75; } }
        @keyframes lift { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

        /* Leaves overlay */
        .leaves-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          z-index: 60;
          overflow: hidden;
          display: block;
          opacity: 0;
          transition: opacity 260ms ease;
        }
        .leaves-overlay.active {
          opacity: 1;
        }

        /* each leaf is an empty span; visual is built with ::before / ::after so no emoji text appears */
        .leaves-overlay .leaf {
          --size: 22px;
          position: absolute;
          top: -12%;
          left: calc(var(--i) * 7%);
          width: var(--size);
          height: calc(var(--size) * 0.7);
          transform-origin: center;
          opacity: 0;
          animation: leafFall ${LEAVES_DURATION_MS}ms cubic-bezier(.12,.78,.32,1) forwards;
          animation-delay: calc(var(--i) * 45ms);
        }

        /* decorative leaf shape using pseudo-elements (no emoji glyphs) */
        .leaves-overlay .leaf::before {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%;
          transform: rotate(-18deg);
          background: linear-gradient(160deg, rgba(34,139,34,0.95), rgba(106,201,117,0.92));
          box-shadow: 0 6px 10px rgba(8,20,12,0.06);
        }
        .leaves-overlay .leaf::after {
          content: "";
          position: absolute;
          left: 44%;
          top: 18%;
          width: 1px;
          height: 60%;
          background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.06));
          transform: rotate(-16deg);
          border-radius: 1px;
          opacity: 0.9;
        }

        /* variety in sizes */
        .leaves-overlay .leaf:nth-child(3n) { --size: 26px; }
        .leaves-overlay .leaf:nth-child(4n) { --size: 18px; }

        @keyframes leafFall {
          0% {
            opacity: 0;
            transform: translateY(-8vh) translateX(0) rotate(-6deg) scale(0.86);
            filter: drop-shadow(0 2px 6px rgba(8,20,12,0.02));
          }
          12% {
            opacity: 0.9;
            transform: translateY(6vh) translateX(2vw) rotate(6deg) scale(1.06);
          }
          60% {
            opacity: 1;
            transform: translateY(60vh) translateX(8vw) rotate(180deg) scale(0.98);
          }
          100% {
            opacity: 0;
            transform: translateY(110vh) translateX(18vw) rotate(380deg) scale(0.94);
            filter: drop-shadow(0 10px 18px rgba(8,20,12,0.06));
          }
        }

        @media (max-width: 640px) {
          .leaves-overlay .leaf { left: calc(var(--i) * 6%); --size: 14px; }
        }
      `}</style>
    </main>
  );
}
