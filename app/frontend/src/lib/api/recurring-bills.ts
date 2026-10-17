import { request } from "./client";
import type { RecurringBillDto, RecurringBillsResponseDto } from "./types";

export async function listRecurringBills(): Promise<RecurringBillsResponseDto> {
  return request<RecurringBillsResponseDto>("/recurring-bills", { method: "GET" });
}

export async function createRecurringBill(input: {
  name: string;
  amount: number;
  type: "expense" | "income";
  account_id: number;
  category_id?: number | null;
  frequency: "weekly" | "monthly" | "yearly";
  next_due: string;
}): Promise<RecurringBillDto> {
  return request<RecurringBillDto>("/recurring-bills", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRecurringBill(
  id: number,
  input: Partial<{
    name: string;
    amount: number;
    type: "expense" | "income";
    account_id: number;
    category_id: number | null;
    frequency: "weekly" | "monthly" | "yearly";
    next_due: string;
  }>
): Promise<RecurringBillDto> {
  return request<RecurringBillDto>(`/recurring-bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteRecurringBill(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/recurring-bills/${id}`, {
    method: "DELETE",
  });
}

export async function markRecurringBillPaid(
  id: number
): Promise<{ message: string; bill: RecurringBillDto; transaction: any }> {
  return request(`/recurring-bills/${id}/mark-paid`, {
    method: "POST",
  });
}
