"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showLeaves, setShowLeaves] = useState(false);

  // 3–second preview
  const AUDIO_MS = 3000;

  const handleStart = async () => {
    // play audio softly
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.32;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {}

    // show leaves animation
    setShowLeaves(true);

    // stop audio + navigate smoothly
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      router.push("/chat");
    }, AUDIO_MS);
  };

  const leaves = Array.from({ length: 12 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ["--i" as any]: i }} />
  ));

  return (
    <main className="min-h-screen flex items-center justify-center p-8 relative bg-gradient-to-b from-emerald-100/50 to-white overflow-hidden">

      {/* Card */}
      <div className="relative z-10 w-full max-w-3xl bg-white/80 backdrop-blur-xl rounded-3xl p-12 border border-emerald-900/5 shadow-xl">
        <div className="flex flex-col items-center text-center gap-6">

          {/* Logo */}
          <div className="w-28 h-28 rounded-full bg-white shadow-lg grid place-items-center border border-emerald-200">
            <img src="/logo.png" alt="logo" width={85} height={85} />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold text-emerald-900 tracking-tight">
            Welcome to Greanly
          </h1>

          <p className="text-lg text-slate-700 max-w-xl leading-relaxed">
            Practical, measurable sustainability insights — with instant steps your business can take today.
          </p>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="mt-2 px-8 py-4 bg-emerald-600 text-white rounded-full shadow-md hover:bg-emerald-700 transition text-lg font-semibold"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* footer */}
      <div className="absolute bottom-6 w-full text-center text-slate-600/80 text-sm z-10">
        Built with care • AI + Sustainability
      </div>

      {/* audio */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves */}
      {showLeaves && (
        <div className="leaves absolute inset-0 pointer-events-none z-20">
          {leaves}
        </div>
      )}

      {/* styles */}
      <style jsx>{`
        .leaves {
          animation: fadeIn 0.3s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .leaf {
          position: absolute;
          top: -10%;
          left: calc(var(--i) * 9%);
          width: 14px;
          height: 20px;
          background: linear-gradient(135deg, #34d399, #059669);
          border-radius: 4px 10px 4px 10px;
          opacity: 0;
          animation: fall 1.4s ease-in forwards;
          animation-delay: calc(var(--i) * 60ms);
        }

        @keyframes fall {
          0% {
            opacity: 0;
            transform: translateY(-10vh) rotate(-30deg);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
