"use client";

import Image from "next/image";
import Link from "next/link";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Loader2, Square } from "lucide-react";

import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { MessageWall } from "@/components/messages/message-wall";
import { ChatHeader, ChatHeaderBlock } from "@/app/parts/chat-header";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import {
  AI_NAME,
  CLEAR_CHAT_TEXT,
  OWNER_NAME,
  WELCOME_MESSAGE,
} from "@/config";

import { UIMessage } from "ai";

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, durations }));
};

/* ---------------------- HELPERS ---------------------- */
function normalizeNumberedList(text: string) {
  if (!text) return text;
  const lines = text.split("\n");
  const numbered = lines.map((ln) => ln.match(/^\s*(\d+)\.\s+/) ? true : false);
  if (!numbered.some(Boolean)) return text;

  let counter = 0;
  return lines
    .map((ln) => {
      const m = ln.match(/^\s*(\d+)\.\s+(.*)$/);
      if (m) {
        if (counter === 0) counter = 1;
        const newLine = `${counter}. ${m[2]}`;
        counter++;
        return newLine;
      } else {
        counter = 0;
        return ln;
      }
    })
    .join("\n");
}

/* ---------------------- CHAT PAGE ---------------------- */
export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeSeen = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const stored =
    typeof window !== "undefined" ? loadStorage() : { messages: [], durations: {} };
  const [initialMessages] = useState<UIMessage[]>(stored.messages);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initialMessages,
  });

  /* INIT */
  useEffect(() => {
    setIsClient(true);
    setDurations(stored.durations);
    setMessages(stored.messages);
    // small scroll correction after mount
    setTimeout(() => {
      if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0;
    }, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isClient) saveStorage(messages, durations);
  }, [messages, durations, isClient]);

  /* WELCOME MESSAGE */
  useEffect(() => {
    if (!isClient || welcomeSeen.current || initialMessages.length > 0) return;

    const normalized = normalizeNumberedList(WELCOME_MESSAGE || "");
    const welcomeMsg: UIMessage = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      parts: [{ type: "text", text: normalized }],
    };

    setMessages([welcomeMsg]);
    saveStorage([welcomeMsg], {});
    welcomeSeen.current = true;

    setTimeout(() => {
      if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0;
    }, 120);
  }, [isClient]);

  /* FORM */
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = (vals: any) => {
    sendMessage({ text: vals.message });
    form.reset();
    if (inputRef.current) inputRef.current.style.height = "44px";
    setTimeout(() => {
      if (messagesContainerRef.current)
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }, 300);
  };

  function clearChat() {
    setMessages([]);
    setDurations({});
    saveStorage([], {});
    toast.success("Chat cleared");
    welcomeSeen.current = false;
  }

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="flex h-screen justify-center bg-transparent">
      <main className="w-full h-screen relative">

        {/* HEADER (fixed + ensured above overlay) */}
        <div
          className="fixed top-0 left-0 right-0 pb-16"
          style={{ zIndex: 80, backdropFilter: "saturate(120%) blur(6px)" }}
        >
          <div className="bg-white/85 dark:bg-black/85">
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
                <p className="text-slate-900 dark:text-slate-100">Chat with {AI_NAME}</p>
              </ChatHeaderBlock>

              <ChatHeaderBlock className="justify-end items-center space-x-3">
                <ThemeToggle />

                <Button variant="outline" size="sm" onClick={clearChat}>
                  {CLEAR_CHAT_TEXT}
                </Button>
              </ChatHeaderBlock>
            </ChatHeader>
          </div>
        </div>

        {/* MESSAGES */}
        <div
          ref={messagesContainerRef}
          className="h-screen overflow-y-auto px-5 py-4 pt-[120px] pb-[200px] flex flex-col items-center"
        >
          <div className="w-full max-w-3xl">
            <div
              className="rounded-2xl p-6"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94))",
                border: "1px solid rgba(13,59,42,0.04)",
                boxShadow: "0 20px 60px rgba(13,59,42,0.04)",
                minHeight: 420,
              }}
            >
              <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                Ask me about sustainability, suppliers, or request a 30/60/90 plan.
              </div>

              <div style={{ minHeight: 240 }}>
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
                      <div className="mt-4 flex items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* INPUT BAR (fixed and above overlay) */}
        <div
          className="fixed bottom-0 left-0 right-0"
          style={{ zIndex: 80, backdropFilter: "saturate(120%) blur(6px)" }}
        >
          <div className="bg-white/92 dark:bg-black/92 pb-3 pt-3">
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
                          <div className="relative">
                            <textarea
                              {...field}
                              ref={(el) => {
                                field.ref(el);
                                inputRef.current = el;
                              }}
                              id="chat-form-message"
                              className="w-full min-h-[48px] max-h-[220px] resize-none overflow-y-auto pl-6 pr-20 py-4 rounded-[28px] bg-gray-100 dark:bg-zinc-900 text-sm text-slate-900 dark:text-slate-100"
                              placeholder="Type your message..."
                              disabled={status === "streaming"}
                              onInput={(e) => {
                                const ta = e.currentTarget;
                                ta.style.height = "auto";
                                ta.style.height = ta.scrollHeight + "px";
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (e.shiftKey) return;
                                  e.preventDefault();
                                  form.handleSubmit(onSubmit)();
                                }
                              }}
                            />

                            {(status === "ready" || status === "error") && (
                              <Button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full"
                                size="icon"
                                disabled={!field.value.trim()}
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                            )}

                            {(status === "streaming" || status === "submitted") && (
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

            <div className="text-xs text-center text-muted-foreground mt-3">
              © {new Date().getFullYear()} {OWNER_NAME} ·{" "}
              <Link href="/terms" className="underline">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
