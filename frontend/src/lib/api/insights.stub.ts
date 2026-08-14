// Stubbed AI insights function — previously a TanStack Start server function.
// TODO: Replace with a real Laravel API endpoint.

import { api } from "./client";

export type AiInsightResult =
  | { kind: "ok"; answer: string; question: string; generatedAt: string }
  | { kind: "not_configured"; message: string }
  | { kind: "empty_history"; message: string }
  | { kind: "error"; message: string; retryable: boolean };

type AiInsightInput = {
  question: string;
  summary: unknown;
  accounts: unknown[];
  transactions: unknown[];
  currency?: string;
};

/**
 * Stub for AI insights. Calls `POST /ai/insights` on the backend.
 * If the endpoint doesn't exist yet, returns a "not configured" result.
 */
export async function getAiInsights(input: {
  data: AiInsightInput;
}): Promise<AiInsightResult> {
  try {
    const result = await api.post<AiInsightResult>("/ai/insights", input.data);
    return result;
  } catch {
    return {
      kind: "not_configured",
      message:
        "AI insights are not yet available. Set up a /api/ai/insights endpoint on your backend.",
    };
  }
}
