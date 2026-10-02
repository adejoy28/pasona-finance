/**
 * Suggestion rules for imported transactions.
 * Pure function matching on description substrings (case-insensitive).
 */

export interface SuggestionResult {
  categoryName?: string;
  type: "income" | "expense" | "transfer";
  transferTarget?: "cash" | "bank";
  matchedRule?: string;
}

export function isOWealthSweep(description: string): boolean {
  if (!description || typeof description !== "string") return false;
  const desc = description.toLowerCase();
  return (
    desc.includes("owealth withdrawal") ||
    desc.includes("auto-save to owealth") ||
    desc.includes("autosave to owealth") ||
    (desc.includes("auto-save") && desc.includes("owealth")) ||
    (desc.includes("owealth balance") && !desc.includes("interest"))
  );
}

export function isOWealthInterest(description: string): boolean {
  if (!description || typeof description !== "string") return false;
  const desc = description.toLowerCase();
  return (
    desc.includes("owealth interest") ||
    desc.includes("interest earned") ||
    (desc.includes("owealth") && desc.includes("interest"))
  );
}

export function suggestCategoryAndType(
  description: string,
  drCr: "dr" | "cr" = "dr",
): SuggestionResult {
  if (!description || typeof description !== "string") {
    return { type: drCr === "cr" ? "income" : "expense" };
  }

  const desc = description.toLowerCase();

  // 1. Bank charges / VAT / Stamp duty
  if (
    desc.includes("stamp duty") ||
    desc.includes("vat") ||
    desc.includes("elec. stamp") ||
    desc.includes("bank charge") ||
    desc.includes("sms charge") ||
    desc.includes("maintenance fee")
  ) {
    return {
      categoryName: "Bank Charges",
      type: "expense",
      matchedRule: "bank_charges",
    };
  }

  // 2. Cash withdrawal (Transfer to Cash)
  if (
    desc.includes("wdrw") ||
    desc.includes("cash out") ||
    desc.includes("atm wdl") ||
    desc.includes("atm withdrawal") ||
    desc.includes("pos withdrawal")
  ) {
    return {
      categoryName: "Cash",
      type: "transfer",
      transferTarget: "cash",
      matchedRule: "cash_withdrawal",
    };
  }

  // 3. Tithe / Offering
  if (desc.includes("tithe") || desc.includes("offering")) {
    return {
      categoryName: "Tithe",
      type: "expense",
      matchedRule: "tithe",
    };
  }

  // 4a. OWealth Interest Earned (Real income)
  if (isOWealthInterest(desc)) {
    return {
      categoryName: "Savings",
      type: "income",
      matchedRule: "owealth_interest",
    };
  }

  // 4b. OWealth Internal Sweep / Transfer
  if (isOWealthSweep(desc)) {
    return {
      categoryName: "Savings",
      type: "transfer",
      transferTarget: "bank",
      matchedRule: "owealth_sweep",
    };
  }

  // 4c. Other generic savings interest
  if (desc.includes("savings interest") && drCr === "cr") {
    return {
      categoryName: "Savings",
      type: "income",
      matchedRule: "savings_interest",
    };
  }

  // 5. Default type based on Dr/Cr
  return {
    type: drCr === "cr" ? "income" : "expense",
  };
}
