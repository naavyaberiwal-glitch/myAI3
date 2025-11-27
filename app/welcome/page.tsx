// app/welcome/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
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
      // ignore autoplay errors
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
    <main className="welcome-hero min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden">
      {/* Gradient background + subtle large blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 welcome-bg">
        <div className="bg-circle left" />
        <div className="bg-circle right" />
      </div>

      {/* decorative left & right inline SVG foliage */}
      <svg className="decor-left" width="420" height="640" viewBox="0 0 420 640" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g fill="none" fillRule="evenodd">
          <path d="M0 360 C40 260 90 220 140 160 C190 100 240 70 300 40 C350 15 420 10 420 10 L420 640 L0 640 Z"
            fill="#DFF6E6" opacity="0.95" />
          <g transform="translate(18,40)" opacity="0.98">
            <path d="M30 420 C56 340 120 300 160 250 C200 200 230 170 290 140" stroke="#14503B" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.14"/>
            <path d="M40 380 C72 336 120 310 160 280" stroke="#0D3B2A" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.18"/>
            <ellipse cx="40" cy="240" rx="34" ry="14" fill="#0D3B2A" opacity="0.12" />
            <ellipse cx="78" cy="200" rx="26" ry="12" fill="#14503B" opacity="0.08" />
            <ellipse cx="118" cy="160" rx="36" ry="15" fill="#0D3B2A" opacity="0.14" />
          </g>
        </g>
      </svg>

      <svg className="decor-right" width="520" height="720" viewBox="0 0 520 720" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g fill="none" fillRule="evenodd">
          <path d="M520 20 C420 80 380 160 320 220 C260 280 200 340 160 420 C120 500 80 580 40 640 L0 720 L520 720 Z"
            fill="#E9FBF3" opacity="0.95" />
          <g transform="translate(70,20)" opacity="0.98">
            <path d="M50 80 C96 140 140 180 190 220 C240 260 270 300 320 360" stroke="#14503B" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.14"/>
            <path d="M60 120 C112 180 160 220 200 260" stroke="#0D3B2A" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.18"/>
            <ellipse cx="240" cy="340" rx="26" ry="12" fill="#14503B" opacity="0.10" />
            <ellipse cx="200" cy="300" rx="18" ry="8" fill="#0D3B2A" opacity="0.08" />
          </g>
        </g>
      </svg>

      {/* main card wrapper with organic SVG blob */}
      <div className="welcome-card-wrapper z-10">
        <svg className="card-blob" viewBox="0 0 900 560" preserveAspectRatio="none" aria-hidden>
          <defs>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="20" stdDeviation="40" floodColor="rgba(13,59,42,0.06)" />
            </filter>
          </defs>
          <path
            d="M120 40 C240 -10 520 -10 680 40 C800 75 880 170 860 290 C840 410 720 520 540 520 C360 520 160 500 110 410 C60 320 80 160 120 40 Z"
            fill="#FFFFFF"
            filter="url(#softShadow)"
          />
        </svg>

        <div className="welcome-card-content">
          <header className="welcome-top">
            {/* top-left logo badge */}
            <div className="logo-top-left" aria-hidden>
              <div className="logo-badge">
                <Image src="/logo.png" width={56} height={56} alt="Greanly" className="rounded-full" />
              </div>
            </div>

            <div className="brand-header">
              <h1 className="welcome-title">Greanly</h1>
              <p className="welcome-sub">
                Make your business greener — practical, measurable steps that save money and reduce waste.
              </p>
            </div>
          </header>

          <section className="features-grid" aria-hidden>
            <div className="feature">
              <div className="feature-icon">✓</div>
              <div className="feature-title">Cut costs & waste</div>
              <div className="feature-sub">Practical steps you can use now</div>
            </div>

            <div className="feature">
              <div className="feature-icon">🔍</div>
              <div className="feature-title">Find better suppliers</div>
              <div className="feature-sub">Sustainable materials & vendors</div>
            </div>

            <div className="feature">
              <div className="feature-icon">⚙️</div>
              <div className="feature-title">Action plans (30/60/90)</div>
              <div className="feature-sub">Simple prioritized next steps</div>
            </div>
          </section>

          <div className="cta-row">
            <button
              onClick={handleGetStarted}
              className="get-started cta-btn"
              aria-label="Get Started with Greanly"
            >
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
        /* layout & background */
        .welcome-hero {
          background: linear-gradient(180deg, rgba(237,250,240,1) 0%, rgba(245,252,248,1) 100%);
        }

        .welcome-bg { position: absolute; inset: 0; z-index: -30; pointer-events: none; }
        .bg-circle { position: absolute; border-radius: 9999px; filter: blur(56px); transform: translateZ(0); }
        .bg-circle.left { left: -160px; top: -160px; width: 520px; height: 520px; background: linear-gradient(135deg, #DFF6E6, #C9F0D1); opacity: 0.6; }
        .bg-circle.right { right: -120px; bottom: -160px; width: 420px; height: 420px; background: linear-gradient(135deg, #F0FFF6, #D9F7E4); opacity: 0.55; }

        /* decorative svg positions */
        .decor-left, .decor-right { position: absolute; z-index: -10; pointer-events: none; opacity: 0.98; filter: drop-shadow(0 10px 30px rgba(13,59,42,0.04)); }
        .decor-left { left: 8px; top: 8%; max-width: 360px; transform: translateX(-6%); }
        .decor-right { right: 8px; bottom: 2%; max-width: 460px; transform: translateX(6%); }

        .welcome-card-wrapper {
          position: relative;
          z-index: 10;
          width: min(1080px, 92%);
          margin: 48px auto;
          display: grid;
          place-items: center;
          pointer-events: auto;
        }

        .card-blob { position: absolute; width: 100%; height: auto; left: 0; top: 0; z-index: 0; overflow: visible; }

        .welcome-card-content {
          position: relative;
          z-index: 1;
          width: 86%;
          max-width: 920px;
          padding: 72px 64px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          align-items: center;
          text-align: center;
          background: transparent;
        }

        .welcome-top { width: 100%; display:flex; align-items:center; justify-content:center; gap:24px; position:relative; }

        .logo-top-left { position:absolute; left:42px; top:-12px; z-index:4; display:flex; align-items:center; justify-content:center; width:64px; height:64px; border-radius:9999px; background: linear-gradient(180deg, rgba(237,250,240,1), rgba(217,239,224,0.9)); box-shadow: 0 10px 30px rgba(13,59,42,0.06); padding:6px; }

        .welcome-title { font-size:38px; line-height:1; font-weight:800; margin:0; color: #10201A; letter-spacing:-0.6px; }
        .welcome-sub { margin-top:12px; font-size:16px; color: rgba(16,32,26,0.75); max-width:760px; margin-left:auto; margin-right:auto; line-height:1.7; }

        .features-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:18px; width:100%; margin-top:6px; justify-items:center; }
        .feature { display:flex; flex-direction:column; gap:8px; align-items:center; padding:18px 24px; border-radius:14px; background: linear-gradient(180deg, rgba(245,252,248,0.9), rgba(237,250,240,0.86)); box-shadow:0 10px 26px rgba(13,59,42,0.03); border:1px solid rgba(13,59,42,0.03); min-height:96px; width:100%; max-width:300px; transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms; }
        .feature:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(13,59,42,0.06); }

        .feature-icon { width:44px; height:44px; border-radius:999px; background: rgba(13,59,42,0.06); display:grid; place-items:center; font-size:16px; color:#0D3B2A; }
        .feature-title { font-weight:700; font-size:15px; color:#10201A; }
        .feature-sub { font-size:13px; color: rgba(16,32,26,0.6); }

        .cta-row { display:flex; justify-content:center; width:100%; }
        .cta-btn { display:inline-flex; align-items:center; gap:12px; padding:14px 28px; border-radius:28px; background: linear-gradient(135deg, #0D3B2A, #14503B); color:#fff; font-weight:700; text-decoration:none; box-shadow:0 14px 40px rgba(13,59,42,0.12); transform: translateY(0); transition: transform 180ms ease, box-shadow 180ms ease; font-size:16px; border:none; cursor:pointer; }
        .cta-btn:hover { transform: translateY(-4px); box-shadow:0 22px 56px rgba(13,59,42,0.16); }

        .welcome-foot { margin-top:6px; color: rgba(16,32,26,0.5); font-size:13px; }

        /* Get-started button micro-interaction */
        .get-started { transition: transform 220ms ease, box-shadow 220ms ease; }
        .get-started:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 18px 40px rgba(16,185,129,0.14), 0 6px 18px rgba(16,185,129,0.06); }

        /* Leaves overlay */
        .leaves-overlay { pointer-events: none; position: fixed; inset: 0; z-index: 60; overflow: hidden; display: block; opacity: 0; transition: opacity 260ms ease; }
        .leaves-overlay.active { opacity: 1; }

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

        /* responsive */
        @media (max-width: 1100px) {
          .decor-left, .decor-right { display: none; }
          .welcome-card-content { padding: 42px 28px; }
          .logo-top-left { left: 22px; top: -8px; }
          .welcome-title { font-size: 30px; }
          .features-grid { grid-template-columns: 1fr; gap: 12px; }
          .welcome-card-wrapper { margin: 24px auto; width: min(920px, 94%); }
        }

        @media (max-width: 480px) {
          .welcome-card-content { padding: 28px 18px; }
          .logo-top-left { display: none; }
          .welcome-title { font-size: 22px; }
          .welcome-sub { font-size: 14px; line-height: 1.5; }
          .feature { min-height: auto; padding: 12px; border-radius: 12px; }
          .cta-btn { width: 100%; justify-content: center; padding: 12px 20px; }
          .decor-left, .decor-right { display: none; }
        }
      `}</style>
    </main>
  );
}
