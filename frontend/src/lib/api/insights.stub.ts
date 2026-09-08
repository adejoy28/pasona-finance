// Stubbed AI insights function — previously a TanStack Start server function.
// TODO: Replace with a real Laravel API endpoint.

import { api, ApiError } from "./client";

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
 * AI insights API caller. Calls `POST /ai/insights` on the backend.
 */
export async function getAiInsights(input: {
  data: AiInsightInput;
}): Promise<AiInsightResult> {
  try {
    const result = await api.post<AiInsightResult>("/ai/insights", input.data);
    return result;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      if (
        err.payload &&
        typeof err.payload === "object" &&
        "kind" in err.payload &&
        typeof (err.payload as Record<string, unknown>).kind === "string"
      ) {
        return err.payload as AiInsightResult;
      }
      if (err.status === 404) {
        return {
          kind: "not_configured",
          message: "AI insights endpoint is not available.",
        };
      }
      return {
        kind: "error",
        message: err.message || "An unexpected error occurred talking to AI insights.",
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
