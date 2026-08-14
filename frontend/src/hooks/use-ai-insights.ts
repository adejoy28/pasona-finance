// AI insights hook. Converted from TanStack Query to plain state.
import { useCallback, useState } from "react";

import { getAiInsights, type AiInsightResult } from "@/lib/api/insights.stub";
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

export function useAiInsights() {
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;

  const [result, setResult] = useState<AiInsightResult | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const generate = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed.length < 3) return;

      setCurrentQuestion(trimmed);
      setIsLoading(true);
      setIsFetching(true);
      setIsError(false);
      setError(null);
      setResult(undefined);

      try {
        const summary = await summaryApi.getSummary();
        const accounts = await accountsApi.listAccounts();
        const txList = (await transactionsApi.listTransactions({
          from: daysAgoIso(TX_LOOKBACK_DAYS),
          per_page: MAX_TX_FOR_LLM,
        })) as TxListResponse;
        const transactions: TransactionDto[] = txList.data ?? [];

        const res = await getAiInsights({
          data: {
            question: trimmed,
            summary,
            accounts,
            transactions,
            currency: userCurrency,
          },
        });
        setResult(res);
      } catch (err) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [userCurrency],
  );

  const reset = useCallback(() => {
    setCurrentQuestion("");
    setResult(undefined);
    setIsLoading(false);
    setIsFetching(false);
    setIsError(false);
    setError(null);
  }, []);

  const refetch = useCallback(() => {
    if (currentQuestion) {
      void generate(currentQuestion);
    }
  }, [currentQuestion, generate]);

  return {
    result,
    isLoading,
    isFetching,
    isError,
    error,
    generate,
    reset,
    refetch,
    hasResult: result?.kind === "ok",
    currentQuestion,
  };
}
