export interface ParsedQuickLog {
  amount?: number;
  description?: string;
  type: "expense" | "income";
  accountName?: string;
  categoryName?: string;
}

/**
 * Natural language sentence parser for Quick Log (Addendum G4.1):
 * Examples:
 * - "Spent 2,500 on lunch from OPay"
 * - "Lunch 1500"
 * - "Bought groceries 4500 with GTBank"
 * - "Salary 350,000 to Access Bank"
 * - "Coffee 750"
 */
export function parseQuickLogSentence(
  text: string,
  availableAccounts: { id: number; name: string }[] = [],
  availableCategories: { id: number; name: string }[] = []
): ParsedQuickLog {
  const trimmed = text.trim();
  if (!trimmed) {
    return { type: "expense" };
  }

  const lower = trimmed.toLowerCase();

  // Detect type: income if keywords present, else default expense
  const isIncome = /\b(salary|received|income|earned|credit|deposit|allowance|refund)\b/i.test(lower);
  const type: "expense" | "income" = isIncome ? "income" : "expense";

  // Match amount: numbers with optional commas and decimals
  // E.g. "2,500", "2500.50", "₦4000", "NGN 5000", "5k"
  let amount: number | undefined;

  // Check for shorthand like "5k" or "2.5k"
  const kMatch = lower.match(/(?:^|\s|[^\w])(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch && kMatch[1]) {
    amount = parseFloat(kMatch[1]) * 1000;
  } else {
    // Normal amount regex
    const amtRegex = /(?:[₦$€£]|ngn\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/i;
    const matches = lower.match(amtRegex);
    if (matches && matches[1]) {
      const cleaned = matches[1].replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      if (!Number.isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }
  }

  // Find matching account
  let matchedAccountName: string | undefined;
  for (const acc of availableAccounts) {
    const accLower = acc.name.toLowerCase();
    if (accLower.length >= 2 && lower.includes(accLower)) {
      matchedAccountName = acc.name;
      break;
    }
  }

  // Find matching category
  let matchedCategoryName: string | undefined;
  for (const cat of availableCategories) {
    const catLower = cat.name.toLowerCase();
    if (catLower.length >= 2 && lower.includes(catLower)) {
      matchedCategoryName = cat.name;
      break;
    }
  }

  // Extract description: remove amount, account name, filler prepositions
  let cleanDesc = trimmed;

  // Remove common prefix verbs
  cleanDesc = cleanDesc.replace(/^(spent|paid|bought|received|got|sent|transferred)\s+/i, "");

  // Remove found account name
  if (matchedAccountName) {
    const accRegex = new RegExp(`\\b(from|to|with|on|via|using)?\\s*${matchedAccountName}\\b`, "gi");
    cleanDesc = cleanDesc.replace(accRegex, "");
  }

  // Remove amount string
  cleanDesc = cleanDesc.replace(/(?:[₦$€£]|ngn\s*)?\b\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\s*k?\b/gi, "");

  // Clean remaining prepositions and dangling words
  cleanDesc = cleanDesc
    .replace(/\b(for|on|from|to|via|with|at|in|using)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If clean description is empty, fallback to category name or generic text
  const description = cleanDesc || matchedCategoryName || (isIncome ? "Income" : "Expense");

  return {
    amount,
    description,
    type,
    accountName: matchedAccountName,
    categoryName: matchedCategoryName,
  };
}

/**
 * Calculates current streak in days from real transactions.
 * Streak counts consecutive days with at least one logged transaction.
 * If 0 logged today, streak ends yesterday (so user can "keep" it).
 * If 0 logged today and yesterday, streak is 0.
 */
export function calculateStreak(
  transactions: { transaction_date?: string }[],
  now: Date = new Date()
): { streak: number; loggedToday: boolean } {
  if (!transactions.length) {
    return { streak: 0, loggedToday: false };
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const toDayString = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = toDayString(now);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toDayString(yesterdayDate);

  const daysSet = new Set<string>();
  for (const t of transactions) {
    if (t.transaction_date) {
      daysSet.add(t.transaction_date.slice(0, 10));
    }
  }

  const loggedToday = daysSet.has(todayStr);

  let currentStreak = 0;
  // If logged today, start checking from today; otherwise start from yesterday
  const checkDate = new Date(now);
  if (!loggedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = toDayString(checkDate);
    if (daysSet.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak: currentStreak, loggedToday };
}
