// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [leavesActive, setLeavesActive] = useState(false);

  // milliseconds to wait before navigation so audio plays a little
  const AUDIO_PLAY_MS = 5500;
  const LEAVES_DURATION_MS = 1200;

  const handleGetStarted = async () => {
    // try to play audio on user click (browsers permit play on gesture)
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.36;
        // ensure loop while we play the snippet
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch (e) {
      // ignore; continue to animation/navigation flow
      // console.warn("audio play failed", e);
    }

    // show falling leaves
    setLeavesActive(true);

    // wait for the requested audio duration (short) then navigate
    setTimeout(() => {
      // optional: stop audio before navigating to avoid abrupt behavior on some devices
      try {
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } catch {}
      router.push("/chat");
    }, AUDIO_PLAY_MS);
  };

  // render a few leaves (emoji used for simplicity)
  const leaves = Array.from({ length: 14 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ['--i' as any]: i }}>
      🍃
    </span>
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

          {/* improved hero text */}
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

      {/* leaves overlay */}
      <div className={`leaves-overlay ${leavesActive ? "active" : ""}`} aria-hidden>
        {leaves}
      </div>

      <style jsx>{`
        .get-started:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 18px 40px rgba(16, 185, 129, 0.18), 0 6px 18px rgba(16, 185, 129, 0.06);
        }

        .animate-logo-lift { animation: lift 900ms cubic-bezier(0.2,0.9,0.2,1) both; }
        .shimmer-ring { background: radial-gradient(circle at 30% 30%, rgba(165,255,205,0.95) 0%, rgba(165,255,205,0.6) 18%, rgba(255,255,255,0.02) 60%); filter: blur(28px); opacity: 0.95; animation: shimmerScale 3200ms ease-in-out infinite; }
        @keyframes shimmerScale { 0% { transform: scale(0.96) rotate(0deg); opacity: 0.75; } 50% { transform: scale(1.03) rotate(7deg); opacity: 1; } 100% { transform: scale(0.96) rotate(0deg); opacity: 0.75; } }
        @keyframes lift { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

        /* leaves overlay */
        .leaves-overlay { pointer-events: none; position: fixed; inset: 0; z-index: 60; overflow: hidden; display:none; }
        .leaves-overlay.active { display:block; }

        .leaves-overlay .leaf {
          position:absolute;
          top:-10%;
          left:calc(var(--i) * 7%);
          font-size: 22px;
          transform: translateY(-8vh) rotate(0deg);
          opacity:0;
          animation: leafFall 1200ms linear forwards;
          animation-delay: calc(var(--i) * 45ms);
          filter: drop-shadow(0 6px 8px rgba(8,20,12,0.06));
        }
        .leaves-overlay .leaf:nth-child(3n) { font-size:24px; }
        .leaves-overlay .leaf:nth-child(4n) { font-size:18px; }
        @keyframes leafFall {
          0% { opacity:0; transform: translateY(-8vh) translateX(0) rotate(-5deg) scale(1); }
          30% { opacity:1; }
          100% { opacity:0.95; transform: translateY(110vh) translateX(18vw) rotate(380deg) scale(0.95); }
        }

        @media (max-width: 640px) {
          .leaves-overlay .leaf { font-size: 14px; left: calc(var(--i) * 6%); }
        }
      `}</style>
    </main>
  );
}
