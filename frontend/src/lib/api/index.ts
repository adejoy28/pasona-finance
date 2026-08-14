export { api, ApiError, onUnauthorized, request, API_ERROR_USER_MESSAGE } from "./client";
export type { ApiErrorKind, RequestOptions } from "./client";

export * as auth from "./auth";
export * as accounts from "./accounts";
export * as transactions from "./transactions";
export * as categories from "./categories";
export * as summary from "./summary";
export * as push from "./push";
export {
  previewImport,
  commitImport,
  type ImportBankSlug,
  type CommitImportInput,
  type CommitImportResult,
} from "./import";

// Stubbed AI server function exports
export { getAiChatResponse, type AiChatResult } from "./chat.stub";
export { getAiInsights, type AiInsightResult } from "./insights.stub";

export type {
  AccountDto,
  CategoryDto,
  TransactionDto,
  UserDto,
  AuthResponse,
  SummaryDto,
  ImportPreviewRow,
  CreateAccountInput,
  CreateTransactionInput,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  AccountType,
  CategoryType,
  TransactionType,
} from "./types";
