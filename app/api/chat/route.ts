import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

import { MODEL } from "@/config";
import { SYSTEM_PROMPT } from "@/prompts";
import { isContentFlagged } from "@/lib/moderation";

import { webSearch } from "./tools/web-search";
import { vectorDatabaseSearch } from "./tools/search-vector-database";

// Intentionally NOT importing supplier-search here so external search cannot crash the route.

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // 1) moderation on latest user text
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();

    if (latestUserMessage) {
      const textParts = latestUserMessage.parts
        .filter((p) => p.type === "text")
        .map((p: any) => ("text" in p ? p.text : ""))
        .join("");

      if (textParts) {
        const moderationResult = await isContentFlagged(textParts);

        if (moderationResult.flagged) {
          const stream = createUIMessageStream({
            execute({ writer }) {
              const textId = "moderation-denial-text";

              writer.write({ type: "start" });
              writer.write({ type: "text-start", id: textId });
              writer.write({
                type: "text-delta",
                id: textId,
                delta:
                  moderationResult.denialMessage ||
                  "Your message violates our guidelines. I can't answer that.",
              });
              writer.write({ type: "text-end", id: textId });
              writer.write({ type: "finish" });
            },
          });

          return createUIMessageStreamResponse({ stream });
        }
      }
    }

    // 2) safe streamText call WITHOUT the external supplier tool
    const result = streamText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools: {
        // keep webSearch (if you want to allow it) and vectorDatabaseSearch
        webSearch,
        vectorDatabaseSearch,
      },
      stopWhen: stepCountIs(10),
      providerOptions: {
        openai: {
          reasoningSummary: "auto",
          reasoningEffort: "low",
          parallelToolCalls: false,
        },
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (err: any) {
    // If anything unexpected happens, return a safe error message to the UI stream so user sees it.
    console.error("Chat route runtime error:", err);

    const stream = createUIMessageStream({
      execute({ writer }) {
        const textId = "fatal-error-text";
        writer.write({ type: "start" });
        writer.write({ type: "text-start", id: textId });
        writer.write({
          type: "text-delta",
          id: textId,
          delta:
            "Sorry — the assistant experienced an internal error. Try again in a moment. If the problem persists, contact support.",
        });
        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
}
