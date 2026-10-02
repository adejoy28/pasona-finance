export interface ColumnMap {
  date: string;
  description: string;
  amount?: string;
  moneyIn?: string;
  moneyOut?: string;
  drCr?: string;
  reference?: string;
}

export interface BankProfile {
  name: string;
  expectedHeaders: string[];
  columnMap: ColumnMap;
  dateFormat: string;
  parseDate: (raw: string) => string | null;
}
