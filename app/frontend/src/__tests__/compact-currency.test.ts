import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { formatCompactCurrency } from "../lib/finance.ts";

describe("formatCompactCurrency helper", () => {
  test("formats values in millions with up to 2 decimal places", () => {
    // 1,390,000 -> ₦1.39M
    assert.equal(formatCompactCurrency(1390000, "NGN"), "₦1.39M");
    // 1,000,000 -> ₦1M
    assert.equal(formatCompactCurrency(1000000, "NGN"), "₦1M");
    // Custom decimals e.g. 3 decimals for 1,390,000 -> ₦1.39M
    assert.equal(formatCompactCurrency(1390000, "NGN", 3), "₦1.39M");
    // Negative millions
    assert.equal(formatCompactCurrency(-2500000, "NGN"), "-₦2.5M");
  });

  test("formats values in thousands with up to 2 decimal places", () => {
    // 393,440 -> ₦393.44K
    assert.equal(formatCompactCurrency(393440, "NGN"), "₦393.44K");
    // 50,000 -> ₦50K
    assert.equal(formatCompactCurrency(50000, "NGN"), "₦50K");
    // 10,500 -> ₦10.5K
    assert.equal(formatCompactCurrency(10500, "NGN"), "₦10.5K");
  });

  test("formats values in billions", () => {
    assert.equal(formatCompactCurrency(1500000000, "NGN"), "₦1.5B");
  });

  test("preserves full format for small amounts under 10k", () => {
    assert.equal(formatCompactCurrency(4500, "NGN"), "₦4,500");
    assert.equal(formatCompactCurrency(0, "NGN"), "₦0");
  });
});
