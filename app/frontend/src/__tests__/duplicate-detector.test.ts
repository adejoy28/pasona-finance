import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  detectDuplicatePairs,
  computeDuplicateChips,
  computeTransferChips,
} from "../lib/duplicate-detector.ts";
import type { TransactionDto } from "../lib/api/types.ts";

describe("Duplicate Detector", () => {
  test("flags exact duplicates on the same date, account, amount, and type", () => {
    const transactions: TransactionDto[] = [
      {
        id: 101,
        account_id: 1,
        type: "expense",
        amount: 5000,
        transaction_date: "2026-10-15 12:00:00",
        description: "Netflix Subscription",
      },
      {
        id: 102,
        account_id: 1,
        type: "expense",
        amount: 5000,
        transaction_date: "2026-10-15 14:30:00",
        description: "Netflix Subscription",
      },
      {
        id: 103,
        account_id: 2,
        type: "expense",
        amount: 5000,
        transaction_date: "2026-10-15 14:30:00",
        description: "Other Account Expense",
      },
    ];

    const pairs = detectDuplicatePairs(transactions, new Set());
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0]?.kind, "dup");
    assert.equal(pairs[0]?.a.id, 101);
    assert.equal(pairs[0]?.b.id, 102);

    const chips = pairs[0]?.matchChips || [];
    const sameDateChip = chips.find((c) => c.label === "Same date");
    const sameAmountChip = chips.find((c) => c.label === "Same amount");
    const sameAccountChip = chips.find((c) => c.label === "Same account");
    const sameTypeChip = chips.find((c) => c.label === "Same type");
    const descChip = chips.find((c) => c.label === "Same description");

    assert.equal(sameDateChip?.matched, true);
    assert.equal(sameAmountChip?.matched, true);
    assert.equal(sameAccountChip?.matched, true);
    assert.equal(sameTypeChip?.matched, true);
    assert.equal(descChip?.matched, true);
  });

  test("flags potential transfer legs between different accounts on the same day", () => {
    const transactions: TransactionDto[] = [
      {
        id: 201,
        account_id: 1,
        type: "expense",
        amount: 25000,
        transaction_date: "2026-10-16 10:00:00",
        description: "Transfer to OPay",
      },
      {
        id: 202,
        account_id: 2,
        type: "income",
        amount: 25000,
        transaction_date: "2026-10-16 10:05:00",
        description: "Inward transfer from GTBank",
      },
    ];

    const pairs = detectDuplicatePairs(transactions, new Set());
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0]?.kind, "transfer");
    assert.equal(pairs[0]?.a.id, 201); // expense leg (from)
    assert.equal(pairs[0]?.b.id, 202); // income leg (to)

    const chips = pairs[0]?.matchChips || [];
    const sameDayChip = chips.find((c) => c.label === "Same day");
    const sameAmountChip = chips.find((c) => c.label === "Same amount");
    const oppositeChip = chips.find((c) => c.label === "Opposite directions");
    const diffAccChip = chips.find((c) => c.label === "Different accounts");

    assert.equal(sameDayChip?.matched, true);
    assert.equal(sameAmountChip?.matched, true);
    assert.equal(oppositeChip?.matched, true);
    assert.equal(diffAccChip?.matched, true);
  });

  test("does not flag dismissed pairs", () => {
    const transactions: TransactionDto[] = [
      {
        id: 301,
        account_id: 1,
        type: "expense",
        amount: 12000,
        transaction_date: "2026-10-17",
        description: "Fuel",
      },
      {
        id: 302,
        account_id: 1,
        type: "expense",
        amount: 12000,
        transaction_date: "2026-10-17",
        description: "Fuel",
      },
    ];

    const dismissed = new Set(["dup_301_302"]);
    const pairs = detectDuplicatePairs(transactions, dismissed);
    assert.equal(pairs.length, 0);
  });

  test("ignores transactions that are already linked transfers", () => {
    const transactions: TransactionDto[] = [
      {
        id: 401,
        account_id: 1,
        to_account_id: 2,
        type: "transfer",
        amount: 50000,
        transaction_date: "2026-10-17",
        description: "Transfer between accounts",
      },
      {
        id: 402,
        account_id: 1,
        to_account_id: 2,
        type: "transfer",
        amount: 50000,
        transaction_date: "2026-10-17",
        description: "Transfer between accounts",
      },
    ];

    const pairs = detectDuplicatePairs(transactions, new Set());
    assert.equal(pairs.length, 0);
  });
});
