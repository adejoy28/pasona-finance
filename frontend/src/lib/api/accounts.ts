import { api } from "./client";
import type { AccountDto, CreateAccountInput } from "./types";

export function listAccounts(): Promise<AccountDto[]> {
  return api.get<AccountDto[]>("/accounts");
}

export function getAccount(id: number): Promise<AccountDto> {
  return api.get<AccountDto>(`/accounts/${id}`);
}

export function createAccount(input: CreateAccountInput): Promise<AccountDto> {
  return api.post<AccountDto>("/accounts", input);
}

export function updateAccount(id: number, input: Partial<CreateAccountInput>): Promise<AccountDto> {
  return api.put<AccountDto>(`/accounts/${id}`, input);
}

export function deleteAccount(id: number): Promise<void> {
  return api.delete<void>(`/accounts/${id}`);
}
