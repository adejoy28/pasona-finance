import { api } from "./client";

export type ProposedDraft = {
  amount: number;
  kind: "expense" | "income";
  description: string;
  account: string;
  category: string;
};

export type AssistantAction =
  | { type: "propose_transaction"; draft: ProposedDraft }
  | {
      type: "navigate";
      to: "budgets" | "goals" | "bills" | "duplicates" | "accounts" | "history" | "home";
    };

export type AssistantMessageResponse = {
  kind: "ok" | "error" | "not_configured";
  reply: string;
  actions?: AssistantAction[];
  message?: string;
  retryable?: boolean;
};

export type AssistantMessageInput = {
  message: string;
  context?: {
    month?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };
};

/**
 * Send a message to Mary (Phase 9b AI Assistant).
 */
export async function sendAssistantMessage(
  input: AssistantMessageInput,
): Promise<AssistantMessageResponse> {
  return api.post<AssistantMessageResponse>("/assistant/message", input);
}
