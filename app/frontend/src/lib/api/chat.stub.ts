// Stubbed AI chat function — previously a TanStack Start server function.
// TODO: Replace with a real Laravel API endpoint.

import { api, ApiError } from "./client";

export type AiChatResult =
  | { kind: "ok"; answer: string; question: string; generatedAt: string }
  | { kind: "not_configured"; message: string }
  | { kind: "empty_history"; message: string }
  | { kind: "error"; message: string; retryable: boolean };

type AiChatInput = {
  question: string;
  messages: { role: "user" | "assistant"; content: string }[];
  summary: unknown;
  accounts: unknown[];
  transactions: unknown[];
  currency?: string;
};

/**
 * AI chat API caller. Calls `POST /ai/chat` on the backend.
 */
export async function getAiChatResponse(input: {
  data: AiChatInput;
}): Promise<AiChatResult> {
  try {
    const result = await api.post<AiChatResult>("/ai/chat", input.data);
    return result;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (
        err.payload &&
        typeof err.payload === "object" &&
        "kind" in err.payload &&
        typeof (err.payload as Record<string, unknown>).kind === "string"
      ) {
        return err.payload as AiChatResult;
      }
      if (err.status === 404) {
        return {
          kind: "not_configured",
          message: "AI chat endpoint is not available.",
        };
      }
      return {
        kind: "error",
        message: err.message || "An unexpected error occurred talking to AI chat.",
        retryable: true,
      };
    }
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Something went wrong.",
      retryable: true,
    };
  }
}
