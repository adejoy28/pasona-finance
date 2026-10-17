import { request } from "./client";
import type { GoalDto, GoalsResponseDto } from "./types";

export async function listGoals(): Promise<GoalsResponseDto> {
  return request<GoalsResponseDto>("/goals", { method: "GET" });
}

export async function createGoal(input: {
  name: string;
  target_amount: number;
  target_date: string;
  account_id?: number | null;
  color?: string | null;
}): Promise<GoalDto> {
  return request<GoalDto>("/goals", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateGoal(
  id: number,
  input: Partial<{
    name: string;
    target_amount: number;
    target_date: string;
    account_id: number | null;
    color: string | null;
  }>
): Promise<GoalDto> {
  return request<GoalDto>(`/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteGoal(id: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/goals/${id}`, {
    method: "DELETE",
  });
}

export async function contributeToGoal(
  id: number,
  input: {
    amount: number;
    account_id: number;
    date?: string;
  }
): Promise<{ message: string; goal: GoalDto; transaction: any }> {
  return request(`/goals/${id}/contribute`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
