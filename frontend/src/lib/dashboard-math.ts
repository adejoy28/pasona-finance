/**
 * Pure dashboard financial calculation functions and definitions.
 * Binding rules per Specification Section 3:
 * - spent = sum of expense transactions in the month whose category is spending (excludes saving-kind categories and transfers).
 * - saved = sum of expense transactions in saving-kind categories.
 * - net = income - spent - saved.
 *
 * In a month with no transfers (or netted transfers), the net change in total balance
 * equals income - (spent + saved) = net.
 */

import type { TransactionDto } from "./api/types";

export interface MonthlyTotals {
  income: number;
  spent: number;
  saved: number;
  net: number;
}

export function toNumber(val: number | string | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return typeof val === "string" ? parseFloat(val) || 0 : val;
}

export function isSavingCategory(categoryName?: string | null): boolean {
  if (!categoryName) return false;
  const normalized = categoryName.trim().toLowerCase();
  return normalized === "savings" || normalized === "saving" || normalized.includes("savings");
}

export function calculateNet(income: number, spent: number, saved: number): number {
  return Number((income - spent - saved).toFixed(2));
}

/**
 * Computes monthly financial totals from transactions for a given month.
 */
export function calculateMonthlyTotals(
  transactions: TransactionDto[],
  savingsCategoryIds: Set<number> = new Set()
): MonthlyTotals {
  let income = 0;
  let spent = 0;
  let saved = 0;

  for (const tx of transactions) {
    if (tx.type === "transfer") {
      // Transfers between user's own accounts are neither income nor expense
      continue;
    }

    const amount = Math.abs(toNumber(tx.amount));

    if (tx.type === "income") {
      income += amount;
    } else if (tx.type === "expense") {
      const isSaving =
        (tx.category_id && savingsCategoryIds.has(tx.category_id)) ||
        isSavingCategory(tx.category?.name);

      if (isSaving) {
        saved += amount;
      } else {
        spent += amount;
      }
    }
  }

  income = Number(income.toFixed(2));
  spent = Number(spent.toFixed(2));
  saved = Number(saved.toFixed(2));
  const net = calculateNet(income, spent, saved);

  return { income, spent, saved, net };
}

/**
 * Calculates the change in total balance resulting from a set of transactions.
 * For any account, income adds to balance, expense subtracts from balance,
 * and transfers move money between accounts (net sum of transfer impact across accounts is 0).
 */
export function calculateBalanceDelta(transactions: TransactionDto[]): number {
  let delta = 0;
  for (const tx of transactions) {
    if (tx.type === "transfer") {
      // Transfers have +amount to to_account and -amount from from_account => net delta = 0
      continue;
    }
    const amount = Math.abs(toNumber(tx.amount));
    if (tx.type === "income") {
      delta += amount;
    } else if (tx.type === "expense") {
      delta -= amount;
    }
  }
  return Number(delta.toFixed(2));
}
