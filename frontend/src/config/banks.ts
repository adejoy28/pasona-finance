// Bank-specific import configuration.
//
// Adding a new bank:
//   1. Add a new slug to `BANKS` with the `accepts` mime/extension the
//      backend will validate against and a `hasTransferSuggestions`
//      flag if the importer can emit transfer hints.
//   2. Add a matching backend controller under
//      `app/Http/Controllers/API/Import/{Bank}ImportController` that
//      extends `BaseImportController`.
//   3. Register its preview/store routes in `routes/api.php`.
//
// The `previewPath` / `storePath` are the FULL paths after `/api`
// (e.g. `/import/kuda/preview`). The frontend never has to assemble
// them, so URL drift between banks is impossible.

export type BankSlug = "generic" | "kuda" | "opay";

export type BankConfig = {
  /** Human-readable label, shown in the bank picker. */
  label: string;
  /** One-line subtitle / hint, shown under the label. */
  hint: string;
  /**
   * File extension(s) the picker accepts. Multiple extensions are
   * comma-separated. Used as the `<input accept>` value.
   */
  accepts: string;
  /** POST path for the preview endpoint (after `/api`). */
  previewPath: string;
  /** POST path for the store endpoint (after `/api`). */
  storePath: string;
  /**
   * True if the importer can emit `transfer_suggestion` values. The
   * UI uses this to decide whether to show the per-row
   * "Looks like a transfer" toggle.
   */
  hasTransferSuggestions: boolean;
};

export const BANKS: Record<BankSlug, BankConfig> = {
  generic: {
    label: "CSV (generic)",
    hint: "A plain CSV with date, amount, type, account, category, description columns.",
    accepts: ".csv,text/csv",
    previewPath: "/import/preview",
    storePath: "/import/store",
    hasTransferSuggestions: false,
  },
  kuda: {
    label: "Kuda Bank",
    hint: "XLSX statement exported from the Kuda app.",
    accepts: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    previewPath: "/import/kuda/preview",
    storePath: "/import/kuda/store",
    hasTransferSuggestions: true,
  },
  opay: {
    label: "OPay",
    hint: "XLSX statement exported from the OPay app.",
    accepts: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    previewPath: "/import/opay/preview",
    storePath: "/import/opay/store",
    hasTransferSuggestions: true,
  },
};

export const BANK_SLUGS: BankSlug[] = ["generic", "kuda", "opay"];

export function getBank(slug: BankSlug): BankConfig {
  return BANKS[slug];
}
