// app/welcome/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function WelcomePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  // timings (ms)
  const AUDIO_PLAY_MS = 3000;
  const LEAVES_DURATION_MS = 1400;
  const LEAVES_SHOW_DELAY = 120;

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
            audio.volume = startVol;
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
    try {
      if (audioRef.current) {
        audioRef.current.volume = 0.36;
        audioRef.current.loop = true;
        await audioRef.current.play();
      }
    } catch {
      // ignore autoplay errors
    }

    setLeavesMounted(true);
    window.setTimeout(() => setLeavesActive(true), LEAVES_SHOW_DELAY);

    window.setTimeout(() => {
      setLeavesActive(false);
      window.setTimeout(() => setLeavesMounted(false), 400);
    }, LEAVES_DURATION_MS + 300);

    window.setTimeout(() => {
      try {
        if (audioRef.current) fadeOutAudio(600);
      } catch {}
      window.setTimeout(() => {
        router.push("/chat");
      }, 700);
    }, AUDIO_PLAY_MS);
  };

  const leaves = Array.from({ length: 14 }).map((_, i) => (
    <span key={i} className="leaf" style={{ ['--i' as any]: i }} aria-hidden />
  ));

  return (
    <main className="welcome-hero min-h-screen w-full flex flex-col items-center justify-start p-4 relative overflow-hidden">
      {/* Header: theme toggle only */}
      <header className="absolute top-4 left-0 right-0 z-50 flex items-center justify-end px-6">
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-40">
        <div className="bg-circle left" />
        <div className="bg-circle right" />
        <div className="pattern-dots" />
        <div className="floating-orb" />
      </div>

      {/* decorative foliage */}
      <svg className="decor-left" width="560" height="760" viewBox="0 0 560 760" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g fill="none" fillRule="evenodd">
          <path d="M0 420 C60 300 140 250 220 180 C300 110 360 70 430 40 C500 10 560 0 560 0 L560 760 L0 760 Z" fill="#DFF6E6" opacity="0.95" />
          <g transform="translate(22,60)" opacity="0.95">
            <path d="M40 500 C76 410 160 360 210 300 C260 240 300 210 370 170" stroke="#14503B" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.14"/>
            <path d="M50 440 C88 392 160 360 210 330" stroke="#0D3B2A" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.18"/>
            <ellipse cx="46" cy="300" rx="44" ry="18" fill="#0D3B2A" opacity="0.10" />
          </g>
        </g>
      </svg>

      <svg className="decor-right" width="640" height="780" viewBox="0 0 640 780" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g fill="none" fillRule="evenodd">
          <path d="M640 40 C520 120 480 200 420 260 C360 320 300 380 240 460 C180 540 120 620 60 700 L0 780 L640 780 Z" fill="#E9FBF3" opacity="0.95" />
          <g transform="translate(86,30)" opacity="0.95">
            <path d="M60 100 C120 190 200 240 260 300 C320 360 360 420 420 500" stroke="#14503B" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.14"/>
            <path d="M70 140 C150 230 220 280 280 340" stroke="#0D3B2A" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.18"/>
            <ellipse cx="300" cy="380" rx="30" ry="14" fill="#14503B" opacity="0.10" />
          </g>
        </g>
      </svg>

      {/* main card with organic blob */}
      <div className="welcome-card-wrapper z-30 mt-20 w-full flex justify-center">
        <svg className="card-blob" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden>
          <defs>
            <filter id="softShadow2" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="36" stdDeviation="64" floodColor="rgba(13,59,42,0.08)" />
            </filter>
          </defs>
          <path d="M120 40 C260 -30 520 -20 720 40 C860 84 960 170 920 310 C880 450 720 560 540 560 C360 560 170 540 110 430 C50 320 68 170 120 40 Z"
            fill="#FFFFFF" filter="url(#softShadow2)"/>
        </svg>

        <div className="welcome-card-content" role="region" aria-label="Welcome card content">
          <header className="welcome-top w-full">
            <div className="logo-top-left" aria-hidden>
              <div className="logo-badge">
                <Image src="/logo.png" width={64} height={64} alt="Greanly" className="rounded-full" />
              </div>
            </div>

            <div className="brand-header" style={{ width: "100%", textAlign: "center" }}>
              <h1 className="welcome-title">Greanly</h1>
              <p className="welcome-sub">
                Make your business greener — practical, measurable steps that save money and reduce waste.
              </p>
            </div>
          </header>

          <section className="features-grid" aria-hidden>
            <div className="feature">
              <div className="feature-icon" aria-hidden>✓</div>
              <div className="feature-title">Cut costs & waste</div>
              <div className="feature-sub">Practical steps you can use now</div>
            </div>

            <div className="feature">
              <div className="feature-icon" aria-hidden>🔍</div>
              <div className="feature-title">Find better suppliers</div>
              <div className="feature-sub">Sustainable materials & vendors</div>
            </div>

            <div className="feature">
              <div className="feature-icon" aria-hidden>⚙️</div>
              <div className="feature-title">Action plans (30/60/90)</div>
              <div className="feature-sub">Simple prioritized next steps</div>
            </div>
          </section>

          <div className="cta-row">
            <button onClick={handleGetStarted} className="get-started cta-btn" aria-label="Get Started">
              <svg className="w-5 h-5 -ml-1" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden>
                <path d="M5 12h14" strokeLinecap="round" />
                <path d="M12 5l7 7-7 7" strokeLinecap="round" />
              </svg>
              <span>Get Started</span>
            </button>
          </div>

          <footer className="welcome-foot">
            <small>Built with care • AI + practical sustainability tips</small>
          </footer>
        </div>
      </div>

      {/* audio */}
      <audio ref={audioRef} src="/ambient-forest.mp3" preload="auto" />

      {/* leaves overlay */}
      {leavesMounted && (
        <div className={`leaves-overlay ${leavesActive ? "active" : ""}`} aria-hidden>
          {leaves}
        </div>
      )}

      <style jsx>{`
        /* Playfair for brand title */
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');

        :root {
          --accent-1: #0D3B2A;
          --accent-2: #14503B;
          --card-text-light: #10201A; /* light-mode card text */
          --card-text-dark: #0F3A2E;  /* chosen B: deep green for dark-mode card text */
        }

        .welcome-hero {
          background: linear-gradient(180deg, rgba(237,250,240,1) 0%, rgba(245,252,248,1) 100%);
          min-height: 100vh;
        }

        .bg-circle { position: absolute; border-radius: 9999px; transform: translateZ(0); pointer-events: none; }
        .bg-circle.left { left: -240px; top: -160px; width: 880px; height: 880px; background: linear-gradient(135deg, rgba(223,246,230,1), rgba(201,240,209,0.96)); filter: blur(90px); opacity: 0.6; }
        .bg-circle.right { right: -180px; bottom: -220px; width: 720px; height: 720px; background: linear-gradient(135deg, rgba(240,255,246,1), rgba(217,247,228,0.96)); filter: blur(72px); opacity: 0.52; }

        .pattern-dots { position: absolute; inset: 0; background-image: radial-gradient(circle at 10% 20%, rgba(13,59,42,0.02) 1px, transparent 1px); background-size: 26px 26px; opacity: 0.25; mask-image: radial-gradient(transparent 0 6%, black 40%); pointer-events: none; z-index: -38; }
        .floating-orb { position: absolute; left: 10%; bottom: 4%; width: 200px; height: 200px; border-radius: 9999px; background: radial-gradient(circle at center, rgba(174,240,199,0.18), rgba(174,240,199,0.06)); filter: blur(36px); z-index: -37; }

        .decor-left, .decor-right { position: absolute; z-index: 8; pointer-events: none; opacity: 0.98; filter: drop-shadow(0 20px 40px rgba(13,59,42,0.04)); }
        .decor-left { left: -6%; top: 6%; width: 36vw; max-width: 560px; transform: translateX(-6%); }
        .decor-right { right: -4%; bottom: -2%; width: 42vw; max-width: 640px; transform: translateX(6%); }

        .welcome-card-wrapper { display:flex; justify-content:center; width:100%; pointer-events: auto; }
        .card-blob { position: absolute; width: 110%; height: auto; left: -5%; top: 8px; z-index: 6; opacity: 0.99; filter: drop-shadow(0 40px 92px rgba(13,59,42,0.08)); pointer-events: none; }

        /* FORCE: card text color depends on theme via CSS var */
        .welcome-card-content {
          position: relative; z-index: 40;
          width: min(1100px, 92%);
          margin: 36px 0;
          padding: 56px 64px 72px;
          display:flex;
          flex-direction:column;
          gap:18px;
          align-items:center;
          text-align:center;
          pointer-events: auto;
          min-height: 420px;
          color: var(--card-text-light); /* default (light) */
        }

        .logo-top-left { position:absolute; left:44px; top:-28px; z-index: 42; width:78px; height:78px; border-radius:999px; background: linear-gradient(180deg, rgba(237,250,240,1), rgba(217,239,224,0.94)); box-shadow: 0 18px 44px rgba(13,59,42,0.06); display:flex; align-items:center; justify-content:center; padding:6px; }
        .logo-top-left img { border-radius:999px; display:block; }

        .welcome-title {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: 48px;
          margin: 0;
          color: var(--accent-1);
          letter-spacing: -0.6px;
          line-height: 1;
        }

        /* subtitle and feature copy inherit .welcome-card-content color (kept consistent across themes) */
        .welcome-sub { margin: 0; margin-top: 10px; color: inherit; max-width:880px; font-size:16px; line-height:1.6; }

        .features-grid { margin-top: 8px; width:100%; display:grid; grid-template-columns: repeat(3, 1fr); gap:18px; align-items:stretch; }
        .feature { background: linear-gradient(180deg, rgba(245,252,248,0.95), rgba(237,250,240,0.92)); border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:8px; align-items:center; border:1px solid rgba(13,59,42,0.035); box-shadow:0 10px 36px rgba(13,59,42,0.03); transition: transform 180ms ease, box-shadow 180ms ease; color: inherit; }
        .feature:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(13,59,42,0.06); }
        .feature-icon { width:56px; height:56px; border-radius:999px; display:grid; place-items:center; font-size:18px; color:var(--accent-1); background: linear-gradient(180deg, rgba(236,247,232,0.94), rgba(217,237,224,0.9)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.55); }
        .feature-title { font-weight:800; color: var(--accent-2); }
        .feature-sub { font-size:13px; color: rgba(16,32,26,0.56); }

        .cta-row { margin-top: 18px; display:flex; justify-content:center; width:100%; }
        .cta-btn {
          display:inline-flex;
          align-items:center;
          gap:12px;
          padding:14px 36px;
          border-radius:999px;
          background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
          color:#fff;
          font-weight:800;
          box-shadow:0 26px 64px rgba(13,59,42,0.18);
          border:none;
          cursor:pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms;
          position: relative;
          z-index: 60;
          opacity: 1;
        }
        .cta-btn:hover { transform: translateY(-4px); box-shadow: 0 36px 92px rgba(13,59,42,0.22); }

        .welcome-foot { margin-top:20px; color: rgba(16,32,26,0.5); font-size:13px; }

        .leaves-overlay { pointer-events:none; position: fixed; inset: 0; z-index: 70; overflow: hidden; display:block; opacity:0; transition: opacity 260ms ease; }
        .leaves-overlay.active { opacity: 1; }
        .leaves-overlay .leaf { --size:22px; position:absolute; top:-12%; left: calc(var(--i) * 7%); width:var(--size); height: calc(var(--size) * 0.7); transform-origin:center; opacity:0; animation: leafFall ${LEAVES_DURATION_MS}ms cubic-bezier(.12,.78,.32,1) forwards; animation-delay: calc(var(--i) * 45ms); }
        .leaves-overlay .leaf::before { content:""; display:block; width:100%; height:100%; border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%; transform: rotate(-18deg); background: linear-gradient(160deg, rgba(34,139,34,0.95), rgba(106,201,117,0.92)); box-shadow: 0 6px 10px rgba(8,20,12,0.06); }
        .leaves-overlay .leaf::after { content:""; position:absolute; left:44%; top:18%; width:1px; height:60%; background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(0,0,0,0.06)); transform: rotate(-16deg); border-radius:1px; opacity:0.9; }
        .leaves-overlay .leaf:nth-child(3n) { --size:26px; }
        .leaves-overlay .leaf:nth-child(4n) { --size:18px; }
        @keyframes leafFall {
          0% { opacity:0; transform: translateY(-8vh) translateX(0) rotate(-6deg) scale(0.86); filter: drop-shadow(0 2px 6px rgba(8,20,12,0.02)); }
          12% { opacity:0.9; transform: translateY(6vh) translateX(2vw) rotate(6deg) scale(1.06); }
          60% { opacity:1; transform: translateY(60vh) translateX(8vw) rotate(180deg) scale(0.98); }
          100% { opacity:0; transform: translateY(110vh) translateX(18vw) rotate(380deg) scale(0.94); filter: drop-shadow(0 10px 18px rgba(8,20,12,0.06)); }
        }

        /* Responsive */
        @media (max-width: 1100px) {
          .decor-left, .decor-right { display:none; }
          .welcome-card-content { padding: 34px 22px 46px; min-height: auto; }
          .features-grid { grid-template-columns: 1fr; gap:14px; }
          .logo-top-left { left: 22px; top: -8px; }
        }

        @media (max-width: 640px) {
          .welcome-title { font-size:28px; }
          .logo-top-left { display:none; }
          .cta-btn { padding: 12px 18px; width:100%; justify-content:center; }
        }

        /* Dark mode: swap the card copy color variable to the chosen deep green (B) */
        :global(.dark) .welcome-hero { background: linear-gradient(180deg, rgba(6,20,18,0.95), rgba(4,14,12,0.98)); }
        :global(.dark) .welcome-card-content { color: var(--card-text-dark) !important; }
        :global(.dark) .welcome-title { color: var(--card-text-dark) !important; }
        :global(.dark) .feature { background: linear-gradient(180deg, rgba(10,36,30,0.58), rgba(6,28,24,0.46)); border: 1px solid rgba(255,255,255,0.04); box-shadow: 0 10px 30px rgba(0,0,0,0.28); color: var(--card-text-dark); }
        :global(.dark) .feature-title { color: var(--card-text-dark); }
        :global(.dark) .cta-btn { background: linear-gradient(135deg, var(--accent-1), var(--accent-2)); box-shadow: 0 28px 76px rgba(0,0,0,0.55); color: #fff; }
      `}</style>
    </main>
  );
}
