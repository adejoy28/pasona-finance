import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNet,
  calculateMonthlyTotals,
  calculateBalanceDelta,
} from "../lib/dashboard-math.ts";
import type { TransactionDto } from "../lib/api/types";

describe("Dashboard Math: net = income - spent - saved", () => {
  test("calculateNet evaluates income - spent - saved accurately", () => {
    const income = 500000;
    const spent = 250000;
    const saved = 50000;
    const net = calculateNet(income, spent, saved);

    assert.equal(net, 200000);
    assert.equal(net, income - spent - saved);
  });

  test("net cash flow equals total balance delta in a month with no transfers", () => {
    const savingsCategoryIds = new Set([99]);

    const transactions: TransactionDto[] = [
      {
        id: 1,
        account_id: 1,
        type: "income",
        amount: 300000,
        transaction_date: "2026-10-01",
        description: "Salary",
      },
      {
        id: 2,
        account_id: 1,
        type: "expense",
        amount: 80000,
        category_id: 10,
        category: { id: 10, name: "Food & Groceries" },
        transaction_date: "2026-10-05",
        description: "Groceries",
      },
      {
        id: 3,
        account_id: 1,
        type: "expense",
        amount: 40000,
        category_id: 99,
        category: { id: 99, name: "Savings" },
        transaction_date: "2026-10-10",
        description: "Emergency Fund",
      },
      {
        id: 4,
        account_id: 1,
        type: "expense",
        amount: 15000,
        category_id: 12,
        category: { id: 12, name: "Transport" },
        transaction_date: "2026-10-15",
        description: "Fuel",
      },
    ];

    const totals = calculateMonthlyTotals(transactions, savingsCategoryIds);

    assert.equal(totals.income, 300000);
    assert.equal(totals.spent, 95000); // 80000 + 15000
    assert.equal(totals.saved, 40000); // 40000
    assert.equal(totals.net, 300000 - 95000 - 40000);
    assert.equal(totals.net, 165000);

    const balanceDelta = calculateBalanceDelta(transactions);
    assert.equal(balanceDelta, 165000);

    // BINDING EQUALITY: net === balanceDelta
    assert.equal(totals.net, balanceDelta);
  });

  test("transfers between own accounts do not alter income, spent, or saved", () => {
    const transactions: TransactionDto[] = [
      {
        id: 1,
        account_id: 1,
        type: "income",
        amount: 100000,
        transaction_date: "2026-10-01",
      },
      {
        id: 2,
        account_id: 1,
        type: "expense",
        amount: 30000,
        category_id: 1,
        category: { id: 1, name: "Food" },
        transaction_date: "2026-10-02",
      },
      {
        id: 3,
        account_id: 1,
        to_account_id: 2,
        type: "transfer",
        amount: 50000,
        transaction_date: "2026-10-03",
        description: "Move to savings account",
      },
    ];

    const totals = calculateMonthlyTotals(transactions);
    assert.equal(totals.income, 100000);
    assert.equal(totals.spent, 30000);
    assert.equal(totals.saved, 0);
    assert.equal(totals.net, 70000);

    // Balance delta across all accounts also equals 70,000 because transfer net delta is 0
    const balanceDelta = calculateBalanceDelta(transactions);
    assert.equal(totals.net, balanceDelta);
  });

  test("handles zero income month with spending", () => {
    const transactions: TransactionDto[] = [
      {
        id: 1,
        account_id: 1,
        type: "expense",
        amount: 45000,
        category_id: 2,
        category: { id: 2, name: "Rent" },
        transaction_date: "2026-10-01",
      },
    ];

    const totals = calculateMonthlyTotals(transactions);
    assert.equal(totals.income, 0);
    assert.equal(totals.spent, 45000);
    assert.equal(totals.saved, 0);
    assert.equal(totals.net, -45000);

    const balanceDelta = calculateBalanceDelta(transactions);
    assert.equal(totals.net, balanceDelta);
  });
});
