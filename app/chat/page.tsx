"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";
import { UIMessage } from "ai";
import { useEffect, useState, useRef } from "react";
import {
  AI_NAME,
  CLEAR_CHAT_TEXT,
  OWNER_NAME,
  WELCOME_MESSAGE,
} from "@/config";
import Image from "next/image";
import Link from "next/link";

/* ---------------------- SCHEMA ---------------------- */
const formSchema = z.object({
  message: z.string().min(1).max(2000),
});

/* ---------------------- STORAGE ---------------------- */
const STORAGE_KEY = "chat-messages";

const loadStorage = () => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch {
    return { messages: [], durations: {} };
  }
};

const saveStorage = (messages: UIMessage[], durations: any) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ messages, durations })
  );
};

/* ---------------------- PROFILE TYPES ---------------------- */
type BusinessProfile = {
  industry?: string;
  materials?: string;
  location?: string;
  goal?: string;
};

/* ---------------------- STRUCTURED EXTRACTION ---------------------- */
function extractProfile(messages: UIMessage[]): BusinessProfile | null {
  const userMsgs = messages.filter((m) => m.role === "user");
  if (!userMsgs.length) return null;

  for (let i = userMsgs.length - 1; i >= 0; i--) {
    const text =
      userMsgs[i].parts
        ?.filter((p: any) => p.type === "text")
        ?.map((p: any) => p.text)
        ?.join(" ") || "";

    if (!text.trim()) continue;

    const ind = text.match(/Industry\s*:\s*(.+)/i)?.[1]?.trim();
    const mat = text.match(/Materials?\s*:\s*(.+)/i)?.[1]?.trim();
    const loc = text.match(/Location\s*:\s*(.+)/i)?.[1]?.trim();
    const goal = text.match(/Goal\s*:\s*(.+)/i)?.[1]?.trim();

    if (ind || mat || loc || goal)
      return { industry: ind, materials: mat, location: loc, goal };
  }
  return null;
}

/* ---------------------- NLP-LITE INFERENCE ---------------------- */
function inferProfile(text: string | undefined): BusinessProfile | null {
  if (!text) return null;
  const t = text.toLowerCase();

  const industryMap: Record<string, string[]> = {
    printing: ["printing", "printer", "offset", "press"],
    apparel: ["fabric", "clothing", "apparel", "garment", "textile"],
    food: ["restaurant", "cafe", "kitchen", "bakery", "food"],
    packaging: ["packaging", "boxes", "cartons", "pouches"],
  };

  for (const [industry, words] of Object.entries(industryMap)) {
    if (words.some((w) => t.includes(w))) return { industry };
  }

  if (t.includes("paper")) return { materials: "paper" };
  if (t.includes("plastic") || t.includes("poly")) return { materials: "plastic" };
  if (t.includes("cotton") || t.includes("fabric")) return { materials: "fabric" };

  const cities = ["mumbai", "delhi", "pune", "jaipur", "kolkata", "bangalore"];
  for (const c of cities) if (t.includes(c)) return { location: c };

  return null;
}

/* ---------------------- SUGGESTION LOGIC ---------------------- */
function suggestionsFor(profile: BusinessProfile | null): string[] {
  if (!profile) return [];

  if (profile.industry?.toLowerCase().includes("printing")) {
    return [
      "Green Practices in printing",
      "Sustainable sourcing options",
      "Green Manufacturing steps",
    ];
  }

  if (profile.industry?.toLowerCase().includes("apparel")) {
    return [
      "Sustainable fabric options",
      "Reduce water in dyeing",
      "Circularity strategies for apparel",
    ];
  }

  if (
    profile.industry?.includes("food") ||
    profile.industry?.includes("restaurant")
  ) {
    return [
      "Reduce food waste steps",
      "Local sourcing options",
      "Composting and waste segregation",
    ];
  }

  if (profile.materials === "paper")
    return ["Find FSC suppliers", "Optimize print runs", "Reduce paper waste"];

  return ["Tell me how to reduce waste", "Help me source better materials"];
}

/* ============================================================
   MAIN CHAT COMPONENT
   ============================================================ */
export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeSeen = useRef(false);
  const suggestionsRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stored = typeof window !== "undefined" ? loadStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  /* INIT */
  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
  }, []);

  useEffect(() => {
    if (isClient) saveStorage(messages, durations);
  }, [messages, durations, isClient]);

  /* ------------------------------------------------------------
     PROFILE + SMART SUGGESTION LOGIC
     ------------------------------------------------------------ */
  useEffect(() => {
    const userMsgs = messages.filter((m) => m.role === "user");
    const lastText =
      userMsgs.at(-1)?.parts
        ?.filter((p: any) => p.type === "text")
        ?.map((p: any) => p.text)
        ?.join(" ") || "";

    const structured = extractProfile(messages);
    const inferred = structured ? null : inferProfile(lastText);

    const profile = structured || inferred || null;

    const triggerWords = ["suggest", "recommend", "options", "help me", "guide me"];
    const askedHelp = triggerWords.some((t) =>
      lastText.toLowerCase().includes(t)
    );

    if (profile || askedHelp) {
      suggestionsRef.current = suggestionsFor(profile);
    } else {
      suggestionsRef.current = [];
    }
  }, [messages]);

  /* ------------------------------------------------------------
     WELCOME MESSAGE
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!isClient || welcomeSeen.current || initialMessages.length > 0) return;

    const welcomeMsg: UIMessage = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      parts: [{ type: "text", text: WELCOME_MESSAGE }],
    };

    setMessages([welcomeMsg]);
    saveStorage([welcomeMsg], {});
    welcomeSeen.current = true;
  }, [isClient]);

  /* ------------------------------------------------------------
     FORM SUBMIT
     ------------------------------------------------------------ */
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = (vals: any) => {
    sendMessage({ text: vals.message });
    form.reset();
  };

  /* ------------------------------------------------------------
     CLEAR CHAT
     ------------------------------------------------------------ */
  function clearChat() {
    setMessages([]);
    setDurations({});
    saveStorage([], {});
    toast.success("Chat cleared");
  }

  /* ------------------------------------------------------------
     CLICKING A SUGGESTION
     ------------------------------------------------------------ */
  function clickSuggestion(text: string) {
    form.setValue("message", text);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(text.length, text.length);
    }, 20);
  }

  /* ------------------------------------------------------------
     SUGGESTION BAR (ONLY WHEN NEEDED)
     ------------------------------------------------------------ */
  const SuggestionsBar = () => {
    const list = suggestionsRef.current;
    if (!list.length) return null;

    return (
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="max-w-3xl w-full px-4">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{
              paddingRight: "200px",
              overflowY: "visible",
            }}
          >
            <div className="flex flex-nowrap gap-3 py-2">
              {list.map((txt, i) => (
                <button
                  key={i}
                  onClick={() => clickSuggestion(txt)}
                  className="suggestion-chip bg-gray-100 hover:bg-gray-200 whitespace-nowrap px-4 py-2 text-sm rounded-full shadow-sm"
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------
     RENDER
     ------------------------------------------------------------ */
  return (
    <div className="flex h-screen justify-center dark:bg-black">
      <main className="w-full h-screen relative">

        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 pb-16 bg-linear-to-b from-background via-background/50 dark:bg-black">
          <ChatHeader>
            <ChatHeaderBlock />
            <ChatHeaderBlock className="justify-center items-center">
              <div className="relative inline-block mr-4">
                <Image
                  src="/logo.png"
                  width={60}
                  height={60}
                  alt="Greanly Avatar"
                  className="rounded-full"
                />
                <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <p>Chat with {AI_NAME}</p>
            </ChatHeaderBlock>
            <ChatHeaderBlock className="justify-end">
              <Button variant="outline" size="sm" onClick={clearChat}>
                {CLEAR_CHAT_TEXT}
              </Button>
            </ChatHeaderBlock>
          </ChatHeader>
        </div>

        {/* MESSAGES */}
        <div className="h-screen overflow-y-auto px-5 py-4 pt-[88px] pb-[150px]">
          <div className="flex flex-col items-center">
            {isClient ? (
              <>
                <MessageWall
                  messages={messages}
                  status={status}
                  durations={durations}
                  onDurationChange={(k, d) =>
                    setDurations((prev) => ({ ...prev, [k]: d }))
                  }
                />
                {status === "submitted" && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </>
            ) : (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* PERSONALIZED SUGGESTIONS */}
        <div
          className="fixed left-0 right-0 pointer-events-none"
          style={{ bottom: "124px", zIndex: 60 }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <SuggestionsBar />
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-linear-to-t from-background pb-3 pt-13 dark:bg-black">
          <div className="w-full px-5 flex justify-center">
            <div className="max-w-3xl w-full">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel className="sr-only">Message</FieldLabel>

                        <div className="relative h-13">
                          <Input
                            {...field}
                            ref={inputRef}
                            className="h-15 pl-5 pr-24 rounded-[20px] bg-card"
                            placeholder="Type your message..."
                            disabled={status === "streaming"}
                          />

                          {(status === "ready" ||
                            status === "error") && (
                            <Button
                              type="submit"
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                              size="icon"
                              disabled={!field.value.trim()}
                              style={{
                                width: 44,
                                height: 44,
                              }}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}

                          {(status === "streaming" ||
                            status === "submitted") && (
                            <Button
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                              size="icon"
                              onClick={() => stop()}
                            >
                              <Square className="size-4" />
                            </Button>
                          )}
                        </div>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </form>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()} {OWNER_NAME} ·{" "}
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>
          </div>
        </div>
      </main>

      {/* GLOBAL CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .suggestion-chip {
          display: inline-flex;
          align-items: center;
          height: 40px;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}
