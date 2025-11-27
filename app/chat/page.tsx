"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    // make sure any previous global overlays (if present) don't affect this page
    // (non-destructive: only removes inline-style overlay markers)
    //comments
    try {
      const overlay = document.querySelector("body::after");
      // no-op: just ensuring nothing else crashes — actual overlay is managed in CSS
    } catch {}
  }, []);

  const handleGetStarted = () => {
    router.push("/chat");
  };

  const onFeatureClick = (id: string) => {
    // small placeholder — you can add analytics or specific actions here
    if (id === "plans") {
      router.push("/chat?focus=plans");
    } else {
      router.push("/chat");
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-8 bg-gradient-to-b from-emerald-50 to-white">
      {/* Big premium hero container */}
      <div
        className="relative w-full max-w-6xl mx-auto rounded-[28px] overflow-visible"
        aria-hidden={false}
      >
        {/* decorative soft shape behind the card */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none"
          style={{ transform: "translateY(-6%)" }}
        >
          <svg
            width="1200"
            height="520"
            viewBox="0 0 1200 520"
            className="max-w-full"
            preserveAspectRatio="none"
            style={{ opacity: 0.95 }}
          >
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#ECF7E8" stopOpacity="1" />
                <stop offset="100%" stopColor="#E6FBF0" stopOpacity="1" />
              </linearGradient>
              <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="30" result="b" />
                <feBlend in="SourceGraphic" in2="b" />
              </filter>
            </defs>

            <path
              d="M0,120 C150,20 350,10 540,40 C730,70 940,70 1200,20 L1200,520 L0,520 Z"
              fill="url(#g1)"
              filter="url(#f1)"
              opacity="0.98"
            />
          </svg>
        </div>

        {/* the main glass card */}
        <section
          className="relative mx-auto rounded-2xl shadow-[0_30px_80px_rgba(6,22,12,0.06)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(249,252,249,0.94))",
            border: "1px solid rgba(13,59,42,0.04)",
            padding: "56px 56px",
          }}
        >
          {/* header area */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                <Image src="/logo.png" alt="Greanly logo" width={72} height={72} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-900 tracking-tight">
                  Greanly
                </h1>
                <p className="mt-1 text-sm text-slate-600 max-w-xl">
                  Make your business greener — practical, measurable steps that save money and reduce
                  waste.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* small secondary controls (kept simple) */}
              <button
                onClick={() => router.push("/about")}
                className="hidden md:inline-flex items-center px-4 py-2 rounded-full text-sm border border-transparent hover:bg-emerald-50 text-emerald-700"
                aria-label="Learn more"
              >
                Learn more
              </button>
            </div>
          </div>

          {/* features grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button
              onClick={() => onFeatureClick("costs")}
              className="feature-card dark:feature-card-dark feature-card--premium"
              aria-label="Cut costs & waste"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg,#eaf9ec,#dff5e2)",
                }}
              >
                <span style={{ fontSize: 20, color: "#047857" }}>✓</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#0b4b3a" }}>
                Cut costs & waste
              </div>
              <div style={{ color: "#6b7b72", fontSize: 14 }}>Practical steps you can use now</div>
            </button>

            <button
              onClick={() => onFeatureClick("suppliers")}
              className="feature-card feature-card--premium"
              aria-label="Find better suppliers"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg,#eaf9ec,#dff5e2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="#0b6b4f" strokeWidth="1.6" />
                  <path d="M21 21L15.6 15.6" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#0b4b3a" }}>
                Find better suppliers
              </div>
              <div style={{ color: "#6b7b72", fontSize: 14 }}>Sustainable materials & vendors</div>
            </button>

            <button
              onClick={() => onFeatureClick("plans")}
              className="feature-card feature-card--premium"
              aria-label="Action plans (30/60/90)"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg,#eaf9ec,#dff5e2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M6 8h12M6 12h12M6 16h8" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#0b4b3a" }}>
                Action plans (30/60/90)
              </div>
              <div style={{ color: "#6b7b72", fontSize: 14 }}>Simple prioritized next steps</div>
            </button>
          </div>

          {/* CTA area */}
          <div className="mt-12 flex items-center justify-center">
            <button
              onClick={handleGetStarted}
              className="cta-button"
              aria-label="Get Started with Greanly"
              style={{
                boxShadow: "0 30px 80px rgba(16,185,129,0.12)",
                border: "none",
                background: "linear-gradient(180deg,#0ea05e,#10864c)",
                color: "#fff",
                padding: "16px 40px",
                borderRadius: 999,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              → Get Started
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            Built with care • AI + practical sustainability tips
          </div>
        </section>
      </div>

      {/* page scoped styles */}
      <style jsx>{`
        .feature-card {
          transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms;
          background: linear-gradient(180deg, rgba(236,247,232,0.8), rgba(233,249,239,0.6));
          border: 1px solid rgba(16,65,46,0.06);
          border-radius: 12px;
        }
        .feature-card:active { transform: translateY(1px) scale(0.998); }

        .cta-button {
          cursor: pointer;
        }

        /* Dark mode tweaks */
        :global(.dark) .feature-card {
          background: linear-gradient(180deg, rgba(8,30,24,0.85), rgba(12,34,28,0.88));
          color: #e7f5ee;
          border: 1px solid rgba(255,255,255,0.04);
        }
        :global(.dark) .feature-card div { color: #d6eadb; }
        :global(.dark) .cta-button {
          background: linear-gradient(180deg,#19c972,#0ca75b);
          color: #042017;
          box-shadow: 0 28px 70px rgba(6,22,18,0.5);
        }

        @media (max-width: 768px) {
          section { padding: 28px 20px; }
          .feature-card { padding: 18px; border-radius: 14px; }
        }
      `}</style>
    </main>
  );
}
