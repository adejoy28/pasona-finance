import { request } from "./client";
import type { BudgetCategoryItemDto, BudgetMonthResponseDto } from "./types";

export async function getBudgets(month?: string): Promise<BudgetMonthResponseDto> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return request<BudgetMonthResponseDto>(`/budgets${query}`, { method: "GET" });
}

export async function setBudgetLimit(input: {
  month: string;
  category_id: number;
  limit_amount: number | null;
}): Promise<any> {
  return request(`/budgets`, {
    method: "POST",
    body: input,
  });
}

export async function bulkSetBudgetLimits(input: {
  month: string;
  budgets: Array<{ category_id: number; limit_amount: number | null }>;
}): Promise<{ message: string; count: number }> {
  return request(`/budgets`, {
    method: "POST",
    body: input,
  });
}

export async function copyPreviousMonthBudgets(input: {
  target_month: string;
  source_month?: string;
}): Promise<{ message: string; count: number }> {
  return request(`/budgets/copy-previous`, {
    method: "POST",
    body: input,
  });
}
