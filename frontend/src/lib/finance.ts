export type Account = {
  id: number;
  name: string;
  type: "bank" | "mobile" | "cash";
  balance: number;
};

export type Category = {
  id: number;
  name: string;
  type: "income" | "expense" | "transfer";
};

export type Transaction = {
  id: number;
  description?: string;
  category?: { name: string };
  transaction_date: string;
  account?: { name: string };
  toAccount?: { name: string } | null;
  type: "income" | "expense" | "transfer";
  amount: number;
};

export type AmountParse = {
  raw: string;
  numeric: number;
  isExpression: boolean;
  projected: number | null;
};

type Token = { type: "number"; value: number } | { type: "op"; value: string } | { type: "paren"; value: string };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let numStr = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      const num = Number(numStr);
      if (isNaN(num)) return null;
      tokens.push({ type: "number", value: num });
      continue;
    }
    if (["+", "-", "*", "/"].includes(char)) {
      tokens.push({ type: "op", value: char });
      i++;
      continue;
    }
    if (["(", ")"].includes(char)) {
      tokens.push({ type: "paren", value: char });
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

class MathParser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): number {
    const result = this.parseExpr();
    if (this.pos < this.tokens.length) {
      throw new Error("Unexpected extra tokens");
    }
    return result;
  }

  private parseExpr(): number {
    let result = this.parseTerm();
    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type === "op" && (token.value === "+" || token.value === "-")) {
        this.pos++;
        const right = this.parseTerm();
        result = token.value === "+" ? result + right : result - right;
      } else {
        break;
      }
    }
    return result;
  }

  private parseTerm(): number {
    let result = this.parseFactor();
    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      if (token.type === "op" && (token.value === "*" || token.value === "/")) {
        this.pos++;
        const right = this.parseFactor();
        if (token.value === "/") {
          if (right === 0) throw new Error("Division by zero");
          result = result / right;
        } else {
          result = result * right;
        }
      } else {
        break;
      }
    }
    return result;
  }

  private parseFactor(): number {
    if (this.pos >= this.tokens.length) throw new Error("Unexpected end");
    const token = this.tokens[this.pos];

    if (token.type === "op" && (token.value === "-" || token.value === "+")) {
      this.pos++;
      const val = this.parseFactor();
      return token.value === "-" ? -val : val;
    }

    if (token.type === "number") {
      this.pos++;
      return token.value;
    }

    if (token.type === "paren" && token.value === "(") {
      this.pos++;
      const val = this.parseExpr();
      if (this.pos >= this.tokens.length || this.tokens[this.pos].type !== "paren" || this.tokens[this.pos].value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      this.pos++;
      return val;
    }

    throw new Error("Unexpected token");
  }
}

export function evaluateMathExpression(expr: string): number | null {
  const normalized = expr
    .replace(/[xX]/g, "*")
    .replace(/÷/g, "/")
    .trim();

  if (!/^[0-9+*/.() -]+$/.test(normalized)) {
    return null;
  }

  try {
    const tokens = tokenize(normalized);
    if (!tokens || tokens.length === 0) return null;

    const parser = new MathParser(tokens);
    const result = parser.parse();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      return null;
    }

    return Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

export function parseAmountInput(raw: string): AmountParse {
  const value = raw.trim();
  if (!value) {
    return { raw: value, numeric: NaN, isExpression: false, projected: null };
  }

  const hasOperators = /[+*/xX÷-]/.test(value.replace(/^-/, ""));
  const isPureNumber = !hasOperators && !isNaN(Number(value));

  if (isPureNumber) {
    const n = Number(value);
    return { raw: value, numeric: n, isExpression: false, projected: null };
  }

  const result = evaluateMathExpression(value);
  const isValid = result !== null && Number.isFinite(result);

  return {
    raw: value,
    numeric: isValid ? result : NaN,
    isExpression: true,
    projected: isValid ? result : null,
  };
}

import { DEFAULT_CURRENCY, resolveCurrency, getIntlCode } from "@/lib/currencies";

export function formatCurrency(value: number, currencySymbol?: string): string {
  const input = currencySymbol || DEFAULT_CURRENCY;
  const code = getIntlCode(input);
  const currency = resolveCurrency(input);
  if (currency) {
    const num = new Intl.NumberFormat("en", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);
    return `${currency.symbol}${num}`;
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    currencyDisplay: "symbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatCompactCurrency(value: number, currencySymbol?: string): string {
  const abs = Math.abs(value);
  const input = currencySymbol || DEFAULT_CURRENCY;
  const currency = resolveCurrency(input);
  const symbol = currency?.symbol ?? "₦";

  if (abs >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `${symbol}${formatted}B`;
  }
  if (abs >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${symbol}${formatted}M`;
  }
  if (abs >= 100_000) {
    const formatted = (value / 1_000).toFixed(0);
    return `${symbol}${formatted}k`;
  }
  return formatCurrency(value, currencySymbol);
}

export const mockAccounts: Account[] = [
  { id: 1, name: "Zenith Savings", type: "bank", balance: 845200 },
  { id: 2, name: "Opay Wallet", type: "mobile", balance: 124500 },
  { id: 3, name: "Cash on Hand", type: "cash", balance: 32000 },
];

export const mockCategories: Category[] = [
  { id: 1, name: "Salary", type: "income" },
  { id: 2, name: "Freelance", type: "income" },
  { id: 3, name: "Food", type: "expense" },
  { id: 4, name: "Transport", type: "expense" },
  { id: 5, name: "Bills", type: "expense" },
  { id: 6, name: "Shopping", type: "expense" },
];

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    description: "Bolt to work",
    category: { name: "Transport" },
    transaction_date: "2026-06-01",
    account: { name: "Opay Wallet" },
    type: "expense",
    amount: 3200,
  },
  {
    id: 2,
    description: "June salary",
    category: { name: "Salary" },
    transaction_date: "2026-06-01",
    account: { name: "Zenith Savings" },
    type: "income",
    amount: 650000,
  },
  {
    id: 3,
    description: "Jumia order",
    category: { name: "Shopping" },
    transaction_date: "2026-05-30",
    account: { name: "Zenith Savings" },
    type: "expense",
    amount: 24800,
  },
  {
    id: 4,
    description: "Spectranet",
    category: { name: "Bills" },
    transaction_date: "2026-05-29",
    account: { name: "Zenith Savings" },
    type: "expense",
    amount: 21000,
  },
  {
    id: 5,
    description: "Lunch",
    category: { name: "Food" },
    transaction_date: "2026-05-29",
    account: { name: "Cash on Hand" },
    type: "expense",
    amount: 4500,
  },
  {
    id: 6,
    description: "To Opay",
    transaction_date: "2026-05-28",
    account: { name: "Zenith Savings" },
    type: "transfer",
    amount: 50000,
  },
  {
    id: 7,
    description: "Client invoice",
    category: { name: "Freelance" },
    transaction_date: "2026-05-25",
    account: { name: "Zenith Savings" },
    type: "income",
    amount: 180000,
  },
];

export const mockCategoryBreakdown = [
  { category_name: "Food", total: 42000 },
  { category_name: "Transport", total: 28500 },
  { category_name: "Bills", total: 56000 },
  { category_name: "Shopping", total: 64800 },
];

export const totalBalance = mockAccounts.reduce((s, a) => s + a.balance, 0);
export const monthlyIncome = 830000;
export const monthlyExpense = 191300;
