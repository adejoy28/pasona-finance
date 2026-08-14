// Frontend copy for `transfer_suggestion` values emitted by the
// bank importers. The backend just emits the slug; the UI maps it to
// a label, a prompt, and (optionally) a target transaction type.
//
// Adding a new suggestion value:
//   1. Add the slug to `TRANSFER_SUGGESTIONS` with its `label`,
//      `prompt`, and `suggestedType`.
//   2. Make sure the matching backend importer actually emits the
//      slug (Laravel: enum / string in the bank controller).
//   3. If the user needs a destination account that doesn't exist
//      yet (e.g. "OWealth savings"), document it in the prompt.

export type TransferSuggestionSlug = "cash_withdrawal" | "interbank" | "owealth";

export type TransferSuggestionConfig = {
  /** Short label, e.g. shown on a chip. */
  label: string;
  /** Full prompt shown next to the row in the preview. */
  prompt: string;
  /**
   * The transaction type the user gets if they accept the
   * suggestion. The destination account is picked by the user at
   * commit time when the type is `transfer`.
   */
  suggestedType: "transfer" | "expense";
};

export const TRANSFER_SUGGESTIONS: Record<TransferSuggestionSlug, TransferSuggestionConfig> = {
  cash_withdrawal: {
    label: "Cash withdrawal",
    prompt: "Looks like a cash withdrawal. Mark as transfer to your cash account?",
    suggestedType: "transfer",
  },
  interbank: {
    label: "Bank transfer",
    prompt: "Looks like a bank transfer. Mark as transfer?",
    suggestedType: "transfer",
  },
  owealth: {
    label: "OWealth savings",
    prompt: "OPay OWealth withdrawal. Mark as transfer to your OWealth savings account?",
    suggestedType: "transfer",
  },
};

export function getTransferSuggestion(
  slug: string | null | undefined,
): TransferSuggestionConfig | null {
  if (!slug) return null;
  if (slug in TRANSFER_SUGGESTIONS) {
    return TRANSFER_SUGGESTIONS[slug as TransferSuggestionSlug];
  }
  return null;
}
