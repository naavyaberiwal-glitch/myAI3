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
import { supplierSearch as supplierSearchHelper } from "./tools/supplier-search"; // your helper function

export const maxDuration = 30;

//
// Adapter: wrap the plain helper function into a tool-like object
// The SDK expects a "Tool" object with an `execute` method (and optional streaming hooks).
// We return an object with execute and cast it to `any` to satisfy TypeScript.
//
const supplierSearchTool = {
  name: "supplierSearch",
  // input will be the query string (or a small object). We accept either.
  async execute({ input }: { input: any }) {
    // normalize input to a string query
    const query = typeof input === "string" ? input : (input?.query || String(input || ""));
    try {
      const res = await supplierSearchHelper(query);
      // return whatever the helper returned. The SDK will forward it to the model/tool pipeline.
      return res;
    } catch (err) {
      return { results: [], error: "Supplier search failed" };
    }
  },
  // Optional streaming hooks could go here if you implement streaming results
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // Get latest user message for moderation
  const latestUserMessage = messages.filter((msg) => msg.role === "user").pop();

  if (latestUserMessage) {
    const textParts = latestUserMessage.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("");

    if (textParts) {
      const moderationResult = await isContentFlagged(textParts);

      if (moderationResult.flagged) {
        const stream = createUIMessageStream({
          execute({ writer }) {
            const textId = "moderation-denial-text";

            writer.write({ type: "start" });

            writer.write({
              type: "text-start",
              id: textId,
            });

            writer.write({
              type: "text-delta",
              id: textId,
              delta:
                moderationResult.denialMessage ||
                "Your message violates our guidelines. I can't answer that.",
            });

            writer.write({
              type: "text-end",
              id: textId,
            });

            writer.write({ type: "finish" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      }
    }
  }

  // Main AI call
  const result = streamText({
    model: MODEL,
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),

    // pass tools. cast supplierSearchTool to `any` so TypeScript won't fail on exact Tool typing
    tools: {
      webSearch,
      supplierSearch: supplierSearchTool as any,
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
}
