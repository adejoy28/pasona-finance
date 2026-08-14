// AI chat hook. Converted from TanStack Query's useMutation to plain state.
import { useCallback, useRef, useState } from "react";

import { getAiChatResponse, type AiChatResult } from "@/lib/api/chat.stub";
import {
  accounts as accountsApi,
  summary as summaryApi,
  transactions as transactionsApi,
  type TransactionDto,
} from "@/lib/api";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { daysAgoIso } from "@/lib/date";
import { useMe } from "@/hooks/use-me";

const MAX_TX_FOR_LLM = 200;
const TX_LOOKBACK_DAYS = 90;

type TxListResponse = { data: TransactionDto[] };
type ChatMessage = { role: "user" | "assistant"; content: string };

export function useAiChat() {
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastResult, setLastResult] = useState<AiChatResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      setMessages((prev) => [...prev, { role: "user" as const, content: trimmed }]);
      setLastResult(null);
      setIsSending(true);

      try {
        const summary = await summaryApi.getSummary();
        const accounts = await accountsApi.listAccounts();
        const txList = (await transactionsApi.listTransactions({
          from: daysAgoIso(TX_LOOKBACK_DAYS),
          per_page: MAX_TX_FOR_LLM,
        })) as TxListResponse;
        const transactions: TransactionDto[] = txList.data ?? [];

        const result = await getAiChatResponse({
          data: {
            question: trimmed,
            messages: messagesRef.current,
            summary,
            accounts,
            transactions,
            currency: userCurrency,
          },
        });

        if (result.kind === "ok") {
          setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
        }
        setLastResult(result);
      } catch {
        setLastResult({
          kind: "error",
          message: "Something went wrong. Please try again.",
          retryable: true,
        });
      } finally {
        setIsSending(false);
      }
    },
    [isSending, userCurrency],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setLastResult(null);
  }, []);

  return {
    messages,
    lastResult,
    isSending,
    send,
    reset,
  };
}
