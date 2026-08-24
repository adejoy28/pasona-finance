// DTOs and request shapes that mirror the Laravel API responses.
// Kept separate from the in-app domain types in `lib/finance.ts` so the
// wire format can evolve independently of the UI.

export type AccountType = "bank" | "mobile" | "cash";
export type CategoryType = "income" | "expense" | "transfer";
export type TransactionType = "income" | "expense" | "transfer";

export type AccountDto = {
  id: number;
  name: string;
  type: AccountType;
  starting_balance?: number | string | null;
  notes?: string | null;
  balance?: number | string;
  created_at?: string;
  updated_at?: string;
};

export type CategoryDto = {
  id: number;
  name: string;
  type: "income" | "expense";
  is_default?: boolean;
};

export type TransactionDto = {
  id: number;
  account_id: number;
  to_account_id?: number | null;
  category_id?: number | null;
  type: TransactionType;
  amount: number | string;
  description?: string | null;
  reference?: string | null;
  transaction_date: string;
  account?: { id: number; name: string };
  to_account?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  is_synced?: boolean;
};

export type UserDto = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  /**
   * ISO timestamp from the backend's User casts. Null/undefined while
   * the user hasn't confirmed their address. Drives the verify-email
   * banner on the dashboard.
   */
  email_verified_at?: string | null;
  /**
   * User's preferred daily reminder time in `HH:mm` (24h). Backed by
   * `users.reminder_time`; surfaced on the settings page and PATCHed
   * back via `updateProfile()`.
   */
  reminder_time?: string | null;
  /**
   * IANA timezone string (e.g. `Africa/Lagos`). Used to interpret
   * `reminder_time` in the user's local clock. Default `Africa/Lagos`.
   */
  timezone?: string | null;
  /**
   * ISO 4217 currency code (e.g. `NGN`, `XOF`). Drives the display
   * currency across the app. Default `NGN`.
   */
  currency?: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserDto;
};

export type SummaryDto = {
  total_balance: number | string;
  accounts: AccountDto[];
  monthly_summary: {
    income: number | string;
    expense: number | string;
    net: number | string;
  };
  category_breakdown: { category_id?: number | null; category_name: string; total: number | string }[];
  daily_breakdown?: { date: string; income: number | string; expense: number | string }[];
};

export type ImportPreviewRow = {
  transaction_date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  is_duplicate: boolean;
  account_id: number;
  /** Bank statement reference / transaction id. Currently emitted by OPay. */
  reference?: string | null;
  /**
   * Hint emitted by the bank's importer when a row looks like a
   * transfer rather than what the row's `type` field says. One of
   * `cash_withdrawal`, `interbank`, or `owealth`. The UI maps these
   * to copy in `src/config/transferSuggestions.ts`.
   */
  transfer_suggestion?: string | null;
  /** Original "to / from" cell from the statement, for tooltips. */
  raw_to_from?: string | null;
  /** Original (pre-cleanup) description cell, for tooltips. */
  raw_description?: string | null;
};

export type CreateAccountInput = {
  name: string;
  type: AccountType;
  currency?: string;
  starting_balance: number;
  notes?: string;
};

export type CreateTransactionInput = {
  account_id: number;
  to_account_id?: number;
  type: TransactionType;
  category_id?: number;
  amount: number;
  description?: string;
  reference?: string;
  transaction_date: string;
  force?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  timezone?: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

/**
 * Fields that can be PATCHed on `/me`. All optional — the backend
 * validator only enforces the ones present.
 */
export type UpdateProfileInput = {
  name?: string;
  reminder_time?: string | null;
  timezone?: string;
  currency?: string;
};
