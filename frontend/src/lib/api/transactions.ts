import { api } from "./client";
import type { CreateTransactionInput, TransactionDto } from "./types";

export type ListTransactionsParams = {
  page?: number;
  per_page?: number;
  from?: string;
  to?: string;
  account_id?: number;
  category_id?: number;
  type?: "income" | "expense" | "transfer";
};

type PaginatedTransactions = {
  data: TransactionDto[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export function listTransactions(
  params: ListTransactionsParams = {},
): Promise<PaginatedTransactions> {
  return api.get<PaginatedTransactions>("/transactions", { query: params });
}

export function getTransaction(id: number): Promise<TransactionDto> {
  return api.get<TransactionDto>(`/transactions/${id}`);
}

export function createTransaction(input: CreateTransactionInput): Promise<TransactionDto> {
  return api.post<TransactionDto>("/transactions", input);
}

export function updateTransaction(
  id: number,
  input: Partial<CreateTransactionInput>,
): Promise<TransactionDto> {
  return api.put<TransactionDto>(`/transactions/${id}`, input);
}

export function deleteTransaction(id: number): Promise<void> {
  return api.delete<void>(`/transactions/${id}`);
}

export function syncTransactions(
  transactions: CreateTransactionInput[],
): Promise<{ message: string }> {
  return api.post<{ message: string }>("/transactions/sync", { transactions });
}
