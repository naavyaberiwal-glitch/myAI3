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

/* ---------------------- CHAT PAGE ---------------------- */
export default function Chat() {
  const [isClient, setIsClient] = useState(false);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const welcomeSeen = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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
  }, []);

  useEffect(() => {
    if (isClient) saveStorage(messages, durations);
  }, [messages, durations, isClient]);

  /* WELCOME MESSAGE */
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

  /* FORM */
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const onSubmit = (vals: any) => {
    sendMessage({ text: vals.message });
    form.reset();
    if (inputRef.current) {
      inputRef.current.style.height = "44px";
    }
  };

  function clearChat() {
    setMessages([]);
    setDurations({});
    saveStorage([], {});
    toast.success("Chat cleared");
  }

  /* ---------------------- RENDER ---------------------- */
  return (
    <div className="app-container">
      {/* TOP HEADER (floating card centered) */}
      <div className="fixed inset-x-0 top-6 flex justify-center z-50 pointer-events-none">
        <div className="w-full max-w-3xl px-4 pointer-events-auto">
          <header className="chat-header soft-card">
            <div className="brand-row">
              <div className="chat-brand-badge">
                <Image src="/logo.png" alt="Greanly" width={28} height={28} />
              </div>
              <div>
                <div className="brand-title">Greanly</div>
                <div className="brand-sub">Clarity with care</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={clearChat}>
                {CLEAR_CHAT_TEXT}
              </Button>
            </div>
          </header>
        </div>
      </div>

      {/* MAIN: messages area - centered column so paper shows around it */}
      <main className="flex-1 flex items-start justify-center mt-[120px] mb-[120px]">
        <div className="w-full max-w-3xl px-4">
          <div className="messages soft-card" style={{ padding: 18 }}>
            <div className="flex flex-col gap-6">
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
                    <div className="flex justify-center">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-center py-10">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* BOTTOM composer (floating card centered) */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center z-50 pointer-events-none">
        <div className="w-full max-w-3xl px-4 pointer-events-auto">
          <div className="composer soft-card">
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
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
                          className="chat-textarea"
                          placeholder="Type your message…"
                          disabled={status === "streaming"}
                          onInput={(e) => {
                            const ta = e.currentTarget;
                            ta.style.height = "auto";
                            ta.style.height = ta.scrollHeight + "px";
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (e.shiftKey) return; // allow newline
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

            <div className="w-full text-center text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} {OWNER_NAME} ·{" "}
              <Link href="/terms" className="underline">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
