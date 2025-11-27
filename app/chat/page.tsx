"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const STORAGE_KEY = "greanly-chat-v1";
const WELCOME = "Hi — I'm Greanly. Tell me about your business (Industry, Materials, Location, Goal) or ask for suggestions.";

function loadMessages(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}
function saveMessages(messages: Message[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function extractProfile(messages: Message[]) {
  // Look for last user message with structured fields OR infer from last user message
  const userMessages = messages.filter((m) => m.role === "user");
  if (!userMessages.length) return null;
  // Try structured extraction: Industry: ..., Materials: ..., Location: ..., Goal: ...
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const text = userMessages[i].text;
    const ind = text.match(/Industry\s*:\s*(.+)/i)?.[1]?.trim();
    const mat = text.match(/Materials?\s*:\s*(.+)/i)?.[1]?.trim();
    const loc = text.match(/Location\s*:\s*(.+)/i)?.[1]?.trim();
    const goal = text.match(/Goal\s*:\s*(.+)/i)?.[1]?.trim();
    if (ind || mat || loc || goal) return { industry: ind, materials: mat, location: loc, goal };
  }
  // Fallback simple inference from last message keywords
  const last = userMessages[userMessages.length - 1].text.toLowerCase();
  const infer: any = {};
  if (/(print|printer|offset|press)/.test(last)) infer.industry = "printing";
  if (/(fabric|cotton|textile|apparel)/.test(last)) infer.industry = "apparel";
  if (/(paper)/.test(last)) infer.materials = "paper";
  if (/(plastic|poly)/.test(last)) infer.materials = "plastic";
  if (/(mumbai|delhi|bangalore|kolkata|pune|jaipur)/.test(last)) infer.location = last.match(/(mumbai|delhi|bangalore|kolkata|pune|jaipur)/)?.[0];
  if (Object.keys(infer).length === 0) return null;
  return infer;
}

function suggestionsForProfile(profile: Record<string, string> | null) {
  if (!profile) return [];
  if (profile.industry?.toLowerCase()?.includes("printing")) {
    return ["Green Practices in printing", "Sustainable sourcing options", "Green manufacturing steps"];
  }
  if (profile.industry?.toLowerCase()?.includes("apparel")) {
    return ["Sustainable fabric options", "Reduce water in dyeing", "Circularity strategies"];
  }
  if (profile.materials === "paper") {
    return ["Find FSC suppliers", "Optimize print runs", "Reduce paper waste"];
  }
  if (profile.location) {
    return [`Sourcing options near ${profile.location}`];
  }
  return [];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState<string[]>([]);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const stored = loadMessages();
    if (stored.length === 0) {
      const welcome: Message = { id: `m-${Date.now()}`, role: "assistant", text: WELCOME };
      setMessages([welcome]);
      saveMessages([welcome]);
    } else {
      setMessages(stored);
    }
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    saveMessages(messages);
    // whenever messages update, compute profile and conditional suggestions
    const profile = extractProfile(messages);
    // Only show suggestions if profile exists OR last user message asked for help
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.text || "";
    const triggerWords = ["suggest", "recommend", "options", "help me", "what are", "how do i"];
    const askedHelp = triggerWords.some((t) => lastUser.toLowerCase().includes(t));
    if (profile || askedHelp) {
      setShowSuggestions(suggestionsForProfile(profile as any));
    } else {
      setShowSuggestions([]);
    }
  }, [messages]);

  function addMessage(role: Message["role"], text: string) {
    const m: Message = { id: `${role}-${Date.now()}`, role, text };
    const next = [...messages, m];
    setMessages(next);
    saveMessages(next);
  }

  function send() {
    const trimmed = value.replace(/\n+$/g, "");
    if (!trimmed.trim()) return;
    addMessage("user", trimmed);
    setValue("");
    // Simple placeholder assistant reply (you can later wire to backend)
    setTimeout(() => {
      addMessage("assistant", `Thanks — got it. I can help with "${trimmed.split("\n")[0].slice(0,80)}". Would you like sourcing options or an action plan?`);
    }, 500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    // shift+enter will naturally insert newline
  }

  function clickSuggestion(txt: string) {
    setValue(txt);
    // focus and move cursor to end
    setTimeout(() => {
      taRef.current?.focus();
      const len = txt.length;
      taRef.current?.setSelectionRange(len, len);
    }, 20);
  }

  // Auto-resize helper
  function adjustHeight(el?: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Greanly" width={40} height={40} className="rounded-full" />
            <div>
              <div className="font-semibold">Greanly</div>
              <div className="text-xs text-gray-600">Sustainability companion</div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <Link href="/terms" className="text-sm text-gray-600 underline">Terms</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className="pt-20 pb-36">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`rounded-lg p-3 ${m.role === "assistant" ? "bg-white border border-gray-100" : "bg-green-50 self-end"}`}>
                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Suggestion chips (conditionally shown) */}
      {showSuggestions.length > 0 && (
        <div className="fixed left-0 right-0 bottom-28 z-40 pointer-events-auto">
          <div className="max-w-4xl mx-auto px-4">
            <div className="overflow-x-auto">
              <div className="flex gap-3 py-2">
                {showSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => clickSuggestion(s)}
                    className="whitespace-nowrap rounded-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input / composer */}
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-white/90 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={(el) => {
                taRef.current = el;
                if (el) adjustHeight(el);
              }}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight(e.target);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message (Shift+Enter for newline, Enter to send)…"
              className="flex-1 min-h-[44px] max-h-[220px] resize-none p-3 rounded-2xl border border-gray-200 bg-white text-sm"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMessages([]);
                  saveMessages([]);
                }}
                className="text-xs text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
                title="Clear"
              >
                Clear
              </button>

              <button
                onClick={send}
                className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700"
              >
                Send
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            © {new Date().getFullYear()} Naavya & Sidhant — <Link href="/terms" className="underline">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
