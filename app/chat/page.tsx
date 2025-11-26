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

const formSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

/* STORAGE */
const STORAGE_KEY = "chat-messages";

type StorageData = {
  messages: UIMessage[];
  durations: Record<string, number>;
};

const loadMessagesFromStorage = () => {
  if (typeof window === "undefined") return { messages: [], durations: {} };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { messages: [], durations: {} };

    const parsed = JSON.parse(stored);
    return {
      messages: parsed.messages || [],
      durations: parsed.durations || {},
    };
  } catch {
    return { messages: [], durations: {} };
  }
};

const saveMessagesToStorage = (
  messages: UIMessage[],
  durations: Record<string, number>
) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ messages, durations } as StorageData)
  );
};

/* BUSINESS CONTEXT EXTRACTION */
type BusinessProfile = {
  industry?: string;
  materials?: string;
  location?: string;
  goal?: string;
};

function extractProfileFromMessages(messages: UIMessage[]): BusinessProfile | null {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return null;

  for (let i = userMessages.length - 1; i >= 0; i--) {
    const text = (userMessages[i].parts || [])
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("\n")
      .trim();

    if (!text) continue;

    const industryMatch = text.match(/Industry\s*:\s*(.+)/i);
    const materialsMatch = text.match(/Materials?\s*:\s*(.+)/i);
    const locationMatch = text.match(/Location\s*:\s*(.+)/i);
    const goalMatch = text.match(/Goal\s*:\s*(.+)/i);

    if (industryMatch || materialsMatch || locationMatch || goalMatch) {
      return {
        industry: industryMatch?.[1]?.trim(),
        materials: materialsMatch?.[1]?.trim(),
        location: locationMatch?.[1]?.trim(),
        goal: goalMatch?.[1]?.trim(),
      };
    }
  }

  return null;
}

/* SUGGESTIONS BASED ON CONTEXT */
function suggestionsForProfile(profile: BusinessProfile) {
  const defaultSuggestions = [
    "Tell me how to reduce waste",
    "Help me source sustainable materials",
    "Make my packaging greener",
  ];

  if (!profile?.industry) return defaultSuggestions;

  const industry = profile.industry.toLowerCase();

  if (industry.includes("printing")) {
    return [
      "Green Practices in printing",
      "Sustainable sourcing options",
      "Green Manufacturing steps",
    ];
  }

  if (industry.includes("apparel")) {
    return [
      "Sustainable fabric options",
      "Reduce water in dyeing",
      "Circularity strategies for apparel",
    ];
  }

  if (industry.includes("food") || industry.includes("restaurant")) {
    return [
      "Reduce food waste steps",
      "Local sourcing options",
      "Composting and waste segregation",
    ];
  }

  return defaultSuggestions;
}

/* MAIN CHAT COMPONENT */
export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeRef = useRef(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  const suggestionListRef = useRef<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const stored = typeof window !== "undefined"
    ? loadMessagesFromStorage()
    : { messages: [], durations: {} };

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
    if (isClient) saveMessagesToStorage(messages, durations);
  }, [messages, durations, isClient]);

  /* EXTRACT PROFILE + UPDATE SUGGESTIONS */
  useEffect(() => {
    const p = extractProfileFromMessages(messages);
    setProfile(p);
    suggestionListRef.current = suggestionsForProfile(p || {});
  }, [messages]);

  /* WELCOME MESSAGE */
  useEffect(() => {
    if (!isClient || initialMessages.length > 0 || welcomeRef.current) return;

    const welcomeMessage: UIMessage = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      parts: [{ type: "text", text: WELCOME_MESSAGE }],
    };

    setMessages([welcomeMessage]);
    saveMessagesToStorage([welcomeMessage], {});
    welcomeRef.current = true;
  }, [isClient, initialMessages.length, setMessages]);

  /* FORM */
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = (data: any) => {
    sendMessage({ text: data.message });
    form.reset();
  };

  function clearChat() {
    setMessages([]);
    setDurations({});
    saveMessagesToStorage([], {});
    toast.success("Chat cleared");
  }

  /* CLICKING SUGGESTION */
  function handleSuggestionClick(s: string) {
    form.setValue("message", s);

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(s.length, s.length);
    }, 10);
  }

  /* ==== NEW SUGGESTION BAR ==== */
  const SuggestionsBar = () => {
    const suggs = suggestionListRef.current;
    if (!suggs?.length) return null;

    return (
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="max-w-3xl w-full px-4">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{ paddingRight: "90px" }}  // ensures last chip is visible
          >
            <div className="flex flex-nowrap items-center gap-3 py-2 min-w-full">
              {suggs.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="suggestion-chip whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* RENDER */
  return (
    <div className="flex h-screen items-center justify-center font-sans dark:bg-black">
      <main className="w-full h-screen relative">

        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-linear-to-b from-background via-background/50 to-transparent pb-16 dark:bg-black">
          <ChatHeader>
            <ChatHeaderBlock />
            <ChatHeaderBlock className="justify-center items-center">
              <div className="relative inline-block mr-4 align-middle">
                <Image
                  src="/logo.png"
                  alt="Greanly Avatar"
                  width={60}
                  height={60}
                  className="rounded-full object-contain"
                />
                <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              </div>

              <p className="tracking-tight">Chat with {AI_NAME}</p>
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

        {/* ==== FIXED SUGGESTIONS ROW ==== */}
        <div className="fixed bottom-[110px] left-0 right-0 z-50 pointer-events-auto">
          <SuggestionsBar />
        </div>

        {/* INPUT BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-linear-to-t from-background pt-13 pb-3 dark:bg-black">
          <div className="w-full px-5 flex justify-center">
            <div className="max-w-3xl w-full">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="message"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="sr-only">
                          Message
                        </FieldLabel>

                        <div className="relative h-13">
                          <Input
                            {...field}
                            id="chat-form-message"
                            ref={inputRef}
                            className="h-15 pr-15 pl-5 bg-card rounded-[20px]"
                            placeholder="Type your message here..."
                            disabled={status === "streaming"}
                          />

                          {(status === "ready" || status === "error") && (
                            <Button
                              type="submit"
                              className="absolute right-3 top-3 rounded-full"
                              disabled={!field.value.trim()}
                              size="icon"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                          )}

                          {(status === "streaming" || status === "submitted") && (
                            <Button
                              className="absolute right-2 top-2 rounded-full"
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

          {/* Footer */}
          <div className="w-full px-5 mt-1 flex justify-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {OWNER_NAME} —{" "}
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>
          </div>
        </div>
      </main>

      {/* Global CSS */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
