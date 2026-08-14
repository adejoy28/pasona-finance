import { useEffect, useState } from "react";
import { CreditCard, Loader2, Smartphone, Wallet } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ApiError, accounts as accountsApi, type AccountDto, type CreateAccountInput } from "@/lib/api";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import type { Account } from "@/lib/finance";
import { useMe } from "@/hooks/use-me";

type AccountType = Account["type"];

const TYPE_OPTIONS: { id: AccountType; label: string; icon: React.ReactNode }[] = [
  { id: "bank", label: "Bank", icon: <CreditCard size={16} /> },
  { id: "mobile", label: "Mobile", icon: <Smartphone size={16} /> },
  { id: "cash", label: "Cash", icon: <Wallet size={16} /> },
];

type AccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog runs in edit mode for that account. */
  account?: Account | null;
  onSaved: (account: Account) => void;
  defaultType?: AccountType;
};

function normalizeAccount(dto: AccountDto): Account {
  const balanceValue = dto.balance ?? dto.starting_balance ?? 0;
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    balance: typeof balanceValue === "string" ? parseFloat(balanceValue) : Number(balanceValue),
  };
}

export function AccountDialog({
  open,
  onOpenChange,
  account,
  onSaved,
  defaultType = "bank",
}: AccountDialogProps) {
  const popup = usePopup();
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const isEditMode = Boolean(account);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(defaultType);
  const [balance, setBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset the form every time the dialog opens. In edit mode the fields
  // prefill from the account; in create mode they start blank.
  useEffect(() => {
    if (!open) return;
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(String(account.balance));
    } else {
      setName("");
      setType(defaultType);
      setBalance("");
    }
    setError(null);
  }, [open, account, defaultType]);

  type AccountInput = Partial<Pick<CreateAccountInput, "name" | "type" | "currency" | "starting_balance">>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Please enter an account name.");
      return;
    }
    const numericBalance = parseFloat(balance || "0");
    if (!Number.isFinite(numericBalance)) {
      setError("Please enter a valid balance.");
      return;
    }
    setError(null);

    setIsSubmitting(true);
    try {
      let saved: AccountDto;
      if (isEditMode && account) {
        const payload: AccountInput = {};
        if (trimmed !== account.name) payload.name = trimmed;
        if (type !== account.type) payload.type = type;
        if (numericBalance !== account.balance) payload.starting_balance = numericBalance;
        if (Object.keys(payload).length === 0) {
          onOpenChange(false);
          setIsSubmitting(false);
          return;
        }
        saved = await accountsApi.updateAccount(account.id, { ...payload, currency: userCurrency });
      } else {
        saved = await accountsApi.createAccount({ name: trimmed, type, currency: userCurrency, starting_balance: numericBalance });
      }
      popup.success(isEditMode ? "Account updated" : "Account created");
      onSaved(normalizeAccount(saved));
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? "Unable to update the account. Please try again."
            : "Unable to create the account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEditMode ? "Edit account" : "New account";
  const description = isEditMode
    ? "Update the name, type, or balance for this account."
    : "Add an account to start tracking transactions against it.";
  const submitLabel = isEditMode ? "Save Changes" : "Create Account";
  const pendingLabel = isEditMode ? "Saving…" : "Creating…";
  const balanceLabel = isEditMode ? "Current Balance" : "Starting Balance";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md rounded-2xl border-0 p-0 gap-0 bg-white"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {title}
            </p>
            <p className="text-sm text-slate-500">{description}</p>
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2"
            >
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Account Name
            </label>
            <input
              type="text"
              placeholder="e.g. Zenith Savings"
              autoFocus
              maxLength={60}
              required
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800 focus:border-indigo-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  disabled={isSubmitting}
                  className={cn(
                    "p-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5",
                    type === opt.id
                      ? opt.id === "bank"
                        ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100"
                        : opt.id === "mobile"
                          ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-100"
                          : "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-100"
                      : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100",
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {balanceLabel}
            </label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              maxLength={20}
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold text-slate-800 focus:border-indigo-300"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 premium-gradient text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {pendingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
