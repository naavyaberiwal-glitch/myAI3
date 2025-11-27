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
    <div className="flex h-screen justify-center">
      <main className="w-full h-screen relative">

        {/* HEADER */}
        <div className="fixed top-0 left-0 right-0 z-50 pb-16 bg-white dark:bg-black">
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

            {/* Right controls: Theme toggle + New (clear) */}
            <ChatHeaderBlock className="justify-end items-center space-x-3">
              <ThemeToggle />

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

        {/* INPUT BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black pb-3 pt-13">
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
                            className="w-full min-h-[44px] max-h-[200px] resize-none overflow-y-auto pl-5 pr-20 py-3 rounded-[20px] bg-gray-100 dark:bg-zinc-900 text-sm"
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
    </div>
  );
}
