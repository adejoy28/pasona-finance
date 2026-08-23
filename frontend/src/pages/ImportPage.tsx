import { useNavigate } from "react-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileUp,
  Info,
  Sparkles,
  Upload,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { FinanceNavbar } from "@/components/finance/Navbar";
import {
  ApiError,
  accounts as accountsApi,
  commitImport,
  previewImport,
  type AccountDto,
  type ImportPreviewRow,
} from "@/lib/api";
import { BANKS, BANK_SLUGS, type BankSlug } from "@/config/banks";
import { getTransferSuggestion } from "@/config/transferSuggestions";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency } from "@/lib/finance";
import { useMe } from "@/hooks/use-me";
import { prepareFileForUpload } from "@/lib/upload/normalize-file";

type EditableRow = ImportPreviewRow & {
  userType: "income" | "expense" | "transfer";
  suggestionDismissed: boolean;
};

type Step = "upload" | "preview" | "done";

function getTypeIcon(type: "income" | "expense" | "transfer") {
  if (type === "income") return <ArrowDownLeft size={14} />;
  if (type === "expense") return <ArrowUpRight size={14} />;
  return <ArrowRightLeft size={14} />;
}

function getTypeTone(type: "income" | "expense" | "transfer") {
  if (type === "income") return "bg-green-50 text-green-600";
  if (type === "expense") return "bg-red-50 text-red-500";
  return "bg-blue-50 text-blue-600";
}

function getRowKey(r: ImportPreviewRow): string {
  return `${r.transaction_date}_${r.amount}_${r.description}_${r.reference ?? ""}`;
}

export function ImportPage() {
  const navigate = useNavigate();
  const popup = usePopup();

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  useEffect(() => {
    document.title = "Import — Pasona";
    accountsApi.listAccounts().then(setAccounts).catch(() => {});
  }, []);

  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;

  const [step, setStep] = useState<Step>("upload");
  const [bank, setBank] = useState<BankSlug>("generic");
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commitFailed, setCommitFailed] = useState(false);

  useEffect(() => {
    if (accountId) return;
    const first = accounts[0];
    if (first) setAccountId(String(first.id));
  }, [accounts, accountId]);

  useEffect(() => {
    setToAccountId("");
  }, [accountId]);

  const bankConfig = BANKS[bank];

  const { importableCount, duplicateCount, transferCount } = useMemo(() => {
    let imp = 0;
    let dup = 0;
    let tx = 0;
    for (const r of rows) {
      if (r.is_duplicate) dup += 1;
      else {
        imp += 1;
        if (r.userType === "transfer") tx += 1;
      }
    }
    return { importableCount: imp, duplicateCount: dup, transferCount: tx };
  }, [rows]);

  const handlePickFile = (next: File | null) => {
    setFile(next);
    setError(null);
  };

  const handleBankChange = (next: BankSlug) => {
    setBank(next);
    setFile(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!file || !accountId || previewing) return;
    setPreviewing(true);
    setError(null);
    try {
      const prepared = prepareFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      fd.append("account_id", accountId);
      const preview = await previewImport(bankConfig.previewPath, fd);
      setRows(
        preview.map((r) => ({
          ...r,
          userType: r.type,
          suggestionDismissed: false,
        })),
      );
      setStep("preview");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.requiresVerifiedEmail) {
          popup.error("Confirm your email to import transactions.", {
            description: "We sent you a link — open it, then come back here.",
          });
          void navigate("/dashboard");
          return;
        }
        setError(err.message);
      } else {
        setError("Unable to preview the file. Please try again.");
      }
    } finally {
      setPreviewing(false);
    }
  };

  const handleAcceptSuggestion = useCallback((key: string) => {
    setRows((prev) => prev.map((r) => (getRowKey(r) === key ? { ...r, userType: "transfer" } : r)));
  }, []);

  const handleDismissSuggestion = useCallback((key: string) => {
    setRows((prev) =>
      prev.map((r) => (getRowKey(r) === key ? { ...r, suggestionDismissed: true } : r)),
    );
  }, []);

  const handleChangeType = useCallback((key: string, next: "income" | "expense" | "transfer") => {
    setRows((prev) => prev.map((r) => (getRowKey(r) === key ? { ...r, userType: next } : r)));
  }, []);

  const handleCommit = async () => {
    if (committing) return;
    if (transferCount > 0 && !toAccountId) {
      setError("Pick a destination account for the transfer rows.");
      return;
    }
    if (transferCount > 0 && toAccountId === accountId) {
      setError("The destination account must be different from the source.");
      return;
    }
    setCommitting(true);
    setError(null);
    setCommitFailed(false);
    try {
      const payloadTransactions = rows
        .filter((r) => !r.is_duplicate)
        .map((r) => ({
          account_id: Number(accountId),
          type: r.userType,
          amount: Number(r.amount),
          description: r.description,
          transaction_date: r.transaction_date,
          reference: r.reference ?? undefined,
          to_account_id: r.userType === "transfer" ? Number(toAccountId) : undefined,
        }));
      await commitImport(bankConfig.storePath, { transactions: payloadTransactions });
      popup.success(`Imported ${importableCount} transaction${importableCount === 1 ? "" : "s"}`);
      setStep("done");
    } catch (err) {
      setCommitFailed(true);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to import transactions. Please try again.");
      }
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-30 card-shadow">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Import Transactions</h1>
          <p className="text-xs text-slate-400 font-medium">Batch upload bank statements (CSV or PDF)</p>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto space-y-6 w-full">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="bg-white p-6 rounded-3xl card-shadow border border-slate-50 space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                Bank / Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BANK_SLUGS.map((slug) => {
                  const cfg = BANKS[slug];
                  const active = bank === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => handleBankChange(slug)}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all",
                        active
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 font-black card-shadow"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 font-bold",
                      )}
                    >
                      <p className="text-xs">{cfg.label}</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">{cfg.format.toUpperCase()}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                Target Account
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 appearance-none outline-none"
                >
                  <option value="" disabled>Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                Statement File ({bankConfig.format.toUpperCase()})
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 bg-slate-50/50 hover:border-blue-400 transition-colors relative">
                <input
                  type="file"
                  accept={bankConfig.accept}
                  onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <FileUp size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {file ? file.name : "Choose a file or drag it here"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports {bankConfig.format.toUpperCase()} up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={!file || !accountId || previewing}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {previewing ? "Analyzing Statement..." : "Preview Import"}
            </button>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-3xl card-shadow border border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900">{importableCount} Ready to Import</p>
                <p className="text-[10px] text-slate-400">{duplicateCount} duplicates will be skipped</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Change File
              </button>
            </div>

            {transferCount > 0 && (
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl space-y-2">
                <p className="text-xs font-black text-blue-900 flex items-center gap-2">
                  <ArrowRightLeft size={16} /> Destination for {transferCount} Transfer{transferCount === 1 ? "" : "s"}
                </p>
                <p className="text-[10px] text-blue-700">
                  Select which account receiving transfers should be linked to:
                </p>
                <div className="relative pt-1">
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 appearance-none outline-none"
                  >
                    <option value="">Select destination account</option>
                    {accounts
                      .filter((a) => String(a.id) !== accountId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
              {rows.map((row) => {
                const key = getRowKey(row);
                const isDup = row.is_duplicate;
                return (
                  <div
                    key={key}
                    className={cn(
                      "p-4 flex items-center justify-between gap-3",
                      isDup && "opacity-40 bg-slate-50/50",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center shrink-0", getTypeTone(row.userType))}>
                        {getTypeIcon(row.userType)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{row.description}</p>
                        <p className="text-[10px] font-medium text-slate-400">{row.transaction_date}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-900">
                        {formatCurrency(row.amount, userCurrency)}
                      </p>
                      {isDup && <span className="text-[9px] font-bold text-amber-600 uppercase">Duplicate</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCommit}
              disabled={committing || importableCount === 0}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {committing ? "Importing..." : `Import ${importableCount} Transactions`}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="bg-white p-8 rounded-3xl card-shadow border border-slate-50 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
              <Check size={32} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Import Complete!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your statement transactions have been added to your account.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={() => void navigate("/dashboard")}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      <FinanceNavbar />
    </div>
  );
}
