// Stubbed AI chat function — previously a TanStack Start server function.
// TODO: Replace with a real Laravel API endpoint.

import { api } from "./client";

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
 * Stub for AI chat. Calls `POST /ai/chat` on the backend.
 * If the endpoint doesn't exist yet, returns a "not configured" result.
 */
export async function getAiChatResponse(input: {
  data: AiChatInput;
}): Promise<AiChatResult> {
  try {
    const result = await api.post<AiChatResult>("/ai/chat", input.data);
    return result;
  } catch {
    return {
      kind: "not_configured",
      message:
        "AI chat is not yet available. Set up a /api/ai/chat endpoint on your backend.",
    };
  }
}
