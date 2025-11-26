"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center h-screen w-full bg-gradient-to-b from-green-50 to-white text-center px-6">
      
      {/* Logo */}
      <div className="animate-fade-in">
        <Image
          src="/logo.png"
          alt="Greanly Logo"
          width={140}
          height={140}
          className="mb-6 drop-shadow-lg"
        />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-900 mb-3 animate-fade-in-slow">
        Greanly
      </h1>
      <p className="text-lg text-gray-600 mb-10 animate-fade-in-slower">
        Your sustainability companion — smarter, simpler, actionable.
      </p>

      {/* Feature bullets */}
      <div className="space-y-2 text-gray-700 mb-10 animate-fade-in-delay">
        <p>• Reduce waste with practical steps</p>
        <p>• Find sustainable suppliers</p>
        <p>• Improve materials, packaging, and sourcing</p>
      </div>

      {/* Button */}
      <button
        onClick={() => router.push("/")}
        className="bg-green-600 text-white px-8 py-3 text-lg rounded-full shadow-lg hover:bg-green-700 transition-transform hover:scale-[1.02]"
      >
        Get Started
      </button>

      {/* Animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-fade-in-slow {
          animation: fadeIn 1.2s ease-out;
        }
        .animate-fade-in-slower {
          animation: fadeIn 1.6s ease-out;
        }
        .animate-fade-in-delay {
          animation: fadeIn 2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
