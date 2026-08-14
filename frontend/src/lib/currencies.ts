export type Currency = {
  symbol: string;
  label: string;
  intlCode: string;
};

export const CURRENCIES: Currency[] = [
  { symbol: "₦", label: "Nigerian Naira", intlCode: "NGN" },
  { symbol: "CFA", label: "CFA Franc (BCEAO)", intlCode: "XOF" },
  { symbol: "FCFA", label: "CFA Franc (BEAC)", intlCode: "XAF" },
  { symbol: "$", label: "US Dollar", intlCode: "USD" },
  { symbol: "€", label: "Euro", intlCode: "EUR" },
  { symbol: "£", label: "British Pound", intlCode: "GBP" },
  { symbol: "GH₵", label: "Ghanaian Cedi", intlCode: "GHS" },
  { symbol: "KSh", label: "Kenyan Shilling", intlCode: "KES" },
  { symbol: "R", label: "South African Rand", intlCode: "ZAR" },
  { symbol: "E£", label: "Egyptian Pound", intlCode: "EGP" },
  { symbol: "TSh", label: "Tanzanian Shilling", intlCode: "TZS" },
  { symbol: "USh", label: "Ugandan Shilling", intlCode: "UGX" },
  { symbol: "RF", label: "Rwandan Franc", intlCode: "RWF" },
  { symbol: "D", label: "Gambian Dalasi", intlCode: "GMD" },
  { symbol: "Le", label: "Sierra Leonean Leone", intlCode: "SLL" },
  { symbol: "L$", label: "Liberian Dollar", intlCode: "LRD" },
  { symbol: "Ar", label: "Malagasy Ariary", intlCode: "MGA" },
  { symbol: "₨", label: "Mauritian Rupee", intlCode: "MUR" },
  { symbol: "Fdj", label: "Djiboutian Franc", intlCode: "DJF" },
];

export const DEFAULT_CURRENCY = "NGN";

export function getCurrencyBySymbol(symbol: string): Currency | undefined {
  return CURRENCIES.find((c) => c.symbol === symbol);
}

export function getCurrencyByIntlCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.intlCode === code);
}

export function resolveCurrency(input: string): Currency | undefined {
  return getCurrencyBySymbol(input) ?? getCurrencyByIntlCode(input);
}

export function getIntlCode(symbol: string): string {
  return resolveCurrency(symbol)?.intlCode ?? "NGN";
}
