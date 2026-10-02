import { useNavigate } from "react-router";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileUp,
  Sparkles,
  X,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { FinanceNavbar } from "@/components/finance/Navbar";
import {
  ApiError,
  accounts as accountsApi,
  categories as categoriesApi,
  checkImportExisting,
  storeImportTransactions,
  type AccountDto,
  type CategoryDto,
  type ImportPreviewRow,
} from "@/lib/api";
import { parseStatementFile } from "@/import/parse";
import { isOWealthSweep, isOWealthInterest } from "@/import/suggest";
import { getTransferSuggestion } from "@/config/transferSuggestions";
import { cn } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useMe } from "@/hooks/use-me";

type EditableRow = ImportPreviewRow & {
  userType: "income" | "expense" | "transfer";
  suggestionDismissed: boolean;
  excluded: boolean;
  dateError?: boolean;
  categoryId?: number;
  toAccountId?: number;
  sheet?: string;
  isOWealthSweep?: boolean;
  isOWealthInterest?: boolean;
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
  return `${r.uuid || ""}_${r.transaction_date}_${r.amount}_${r.description}_${r.reference ?? ""}`;
}

export function ImportPage() {
  const navigate = useNavigate();
  const popup = usePopup();

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  useEffect(() => {
    document.title = "Import — Pasona";
    accountsApi.listAccounts().then(setAccounts).catch(() => {});
    categoriesApi.listCategories().then(setCategories).catch(() => {});
  }, []);

  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const { renderAmount } = usePrivacyMode();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");

  const [rows, setRows] = useState<EditableRow[]>([]);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("all");
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [previewing, setPreviewing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) return;
    const first = accounts[0];
    if (first) setAccountId(String(first.id));
  }, [accounts, accountId]);

  useEffect(() => {
    setToAccountId("");
  }, [accountId]);

  const destinationAccountOptions = useMemo(
    () => accounts.filter((a) => String(a.id) !== accountId),
    [accounts, accountId],
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );

  const { importableCount, duplicateCount, transferCount, excludedCount } = useMemo(() => {
    let imp = 0;
    let dup = 0;
    let tx = 0;
    let exc = 0;
    for (const r of rows) {
      if (r.is_duplicate) dup += 1;
      if (r.excluded) {
        exc += 1;
      } else {
        imp += 1;
        if (r.userType === "transfer") tx += 1;
      }
    }
    return { importableCount: imp, duplicateCount: dup, transferCount: tx, excludedCount: exc };
  }, [rows]);

  const {
    owealthSweepCount,
    owealthSweepActiveCount,
    owealthInterestCount,
    owealthInterestActiveCount,
  } = useMemo(() => {
    let sweepTotal = 0;
    let sweepActive = 0;
    let interestTotal = 0;
    let interestActive = 0;
    for (const r of rows) {
      if (r.isOWealthSweep) {
        sweepTotal += 1;
        if (!r.excluded) sweepActive += 1;
      }
      if (r.isOWealthInterest) {
        interestTotal += 1;
        if (!r.excluded) interestActive += 1;
      }
    }
    return {
      owealthSweepCount: sweepTotal,
      owealthSweepActiveCount: sweepActive,
      owealthInterestCount: interestTotal,
      owealthInterestActiveCount: interestActive,
    };
  }, [rows]);

  const handlePickFile = (next: File | null) => {
    setFile(next);
    setError(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handlePickFile(droppedFile);
    }
  };

  const handlePreview = async () => {
    if (!file || !accountId || previewing) return;
    setPreviewing(true);
    setError(null);
    try {
      const parsed = await parseStatementFile(file, undefined, true);

      // Determine date range for check
      const validDates = parsed.rows
        .filter((r) => !r.dateError && r.date)
        .map((r) => r.date)
        .sort();

      const dateFrom = validDates[0] ?? new Date().toISOString().slice(0, 10);
      const dateTo = validDates[validDates.length - 1] ?? dateFrom;

      // Check existing transactions for deduplication
      let existingRows: { date: string; type: string; amount: number; reference?: string | null }[] = [];
      try {
        existingRows = await checkImportExisting({
          account_id: Number(accountId),
          date_from: dateFrom,
          date_to: dateTo,
        });
      } catch (checkErr) {
        console.warn("Could not check existing transactions:", checkErr);
      }

      // Count existing occurrences to support count-aware duplicates
      const existingCounts = new Map<string, number>();
      for (const item of existingRows) {
        const key = item.reference
          ? `ref:${item.reference}`
          : `${item.date}:${item.type}:${Number(item.amount).toFixed(2)}`;
        existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
      }

      // Pre-match suggested category against loaded categories (type-aware)
      const findCategoryId = (catName?: string, type?: "income" | "expense" | "transfer") => {
        if (!catName || type === "transfer") return undefined;
        const lower = catName.toLowerCase();
        const match = categories.find(
          (c) => c.name.toLowerCase() === lower && (!type || c.type === type),
        );
        return match?.id;
      };

      const rowCounts = new Map<string, number>();
      const initialRows: EditableRow[] = parsed.rows.map((r) => {
        const isSweep = isOWealthSweep(r.description);
        const isInterest = isOWealthInterest(r.description);

        // Base financial direction: credit is money in (income), debit is money out (expense)
        // If it's an OWealth interest, force income regardless
        const baseType: "income" | "expense" = isInterest
          ? "income"
          : r.drCr === "cr"
          ? "income"
          : "expense";

        const key = r.reference
          ? `ref:${r.reference}`
          : `${r.date}:${baseType}:${Number(r.amount).toFixed(2)}`;
        const seen = rowCounts.get(key) ?? 0;
        rowCounts.set(key, seen + 1);

        const availableExisting = existingCounts.get(key) ?? 0;
        const isDuplicate = seen < availableExisting;

        // Auto-exclude duplicates, date errors, and internal OWealth sweeps by default
        const isExcluded = isDuplicate || Boolean(r.dateError) || isSweep;

        return {
          uuid: r.uuid,
          transaction_date: r.date,
          description: r.description,
          amount: r.amount,
          type: baseType,
          userType: isSweep ? "transfer" : baseType,
          is_duplicate: isDuplicate,
          account_id: Number(accountId),
          reference: r.reference ?? null,
          transfer_suggestion: isSweep
            ? "owealth"
            : r.suggestedType === "transfer"
            ? (r.sheet?.toLowerCase().includes("owealth") || r.description.toLowerCase().includes("owealth") ? "owealth" : "cash_withdrawal")
            : null,
          suggestionDismissed: false,
          excluded: isExcluded,
          dateError: r.dateError,
          categoryId: findCategoryId(r.suggestedCategory, isSweep ? undefined : baseType),
          sheet: r.sheet,
          isOWealthSweep: isSweep,
          isOWealthInterest: isInterest,
        };
      });

      setRows(initialRows);
      setAvailableSheets(parsed.availableSheets ?? []);
      setSelectedSheet("all");
      setStep("preview");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.requiresVerifiedEmail) {
          popup.error("Confirm your email to import transactions.", {
            description: "We sent you a link — open it, then come back here.",
          });
          void navigate("/dashboard");
          return;
        }
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to preview the file. Please check file format and try again.");
      }
    } finally {
      setPreviewing(false);
    }
  };

  const handleToggleExclude = useCallback((key: string) => {
    setRows((prev) =>
      prev.map((r) => (getRowKey(r) === key ? { ...r, excluded: !r.excluded } : r)),
    );
  }, []);

  const handleToggleOWealthSweeps = useCallback((exclude: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.isOWealthSweep ? { ...r, excluded: exclude } : r)),
    );
    popup.success(
      exclude ? "Excluded all OWealth sweeps" : "Included all OWealth sweeps",
    );
  }, [popup]);

  const handleToggleOWealthInterest = useCallback((exclude: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.isOWealthInterest ? { ...r, excluded: exclude } : r)),
    );
    popup.success(
      exclude ? "Excluded OWealth interest payments" : "Included OWealth interest payments",
    );
  }, [popup]);

  const handleRowCategoryChange = useCallback((key: string, categoryId?: number) => {
    setRows((prev) =>
      prev.map((r) => (getRowKey(r) === key ? { ...r, categoryId } : r)),
    );
  }, []);

  const handleRowToAccountChange = useCallback((key: string, toAccountId?: number) => {
    setRows((prev) =>
      prev.map((r) => (getRowKey(r) === key ? { ...r, toAccountId } : r)),
    );
  }, []);

  const handleBulkToAccountChange = useCallback((val: string) => {
    setToAccountId(val);
    const nextId = val ? Number(val) : undefined;
    if (nextId) {
      setRows((prev) =>
        prev.map((r) => (r.userType === "transfer" ? { ...r, toAccountId: nextId } : r)),
      );
    }
  }, []);

  const handleRowTypeChange = useCallback(
    (key: string, nextType: "income" | "expense" | "transfer") => {
      setRows((prev) =>
        prev.map((r) => {
          if (getRowKey(r) !== key) return r;
          let nextCatId = r.categoryId;
          let nextToAccId = r.toAccountId;
          if (nextType === "transfer") {
            nextCatId = undefined;
            if (!nextToAccId && toAccountId) {
              nextToAccId = Number(toAccountId);
            }
          } else {
            nextToAccId = undefined;
            if (nextCatId) {
              const isCatValid = categories.some(
                (c) => c.id === nextCatId && c.type === nextType,
              );
              if (!isCatValid) nextCatId = undefined;
            }
          }
          return {
            ...r,
            userType: nextType,
            categoryId: nextCatId,
            toAccountId: nextToAccId,
          };
        }),
      );
    },
    [categories, toAccountId],
  );

  const handleCycleType = useCallback(
    (key: string) => {
      const cycleMap: Record<"income" | "expense" | "transfer", "income" | "expense" | "transfer"> = {
        expense: "income",
        income: "transfer",
        transfer: "expense",
      };
      setRows((prev) =>
        prev.map((r) => {
          if (getRowKey(r) !== key) return r;
          const nextType = cycleMap[r.userType];
          let nextCatId = r.categoryId;
          let nextToAccId = r.toAccountId;
          if (nextType === "transfer") {
            nextCatId = undefined;
            if (!nextToAccId && toAccountId) {
              nextToAccId = Number(toAccountId);
            }
          } else {
            nextToAccId = undefined;
            if (nextCatId) {
              const isCatValid = categories.some(
                (c) => c.id === nextCatId && c.type === nextType,
              );
              if (!isCatValid) nextCatId = undefined;
            }
          }
          return {
            ...r,
            userType: nextType,
            categoryId: nextCatId,
            toAccountId: nextToAccId,
          };
        }),
      );
    },
    [categories, toAccountId],
  );

  const handleBulkSetType = useCallback(
    (nextType: "income" | "expense" | "transfer") => {
      let count = 0;
      setRows((prev) =>
        prev.map((r) => {
          if (r.excluded) return r;
          count++;
          let nextCatId = r.categoryId;
          let nextToAccId = r.toAccountId;
          if (nextType === "transfer") {
            nextCatId = undefined;
            if (!nextToAccId && toAccountId) {
              nextToAccId = Number(toAccountId);
            }
          } else {
            nextToAccId = undefined;
            if (nextCatId) {
              const isCatValid = categories.some(
                (c) => c.id === nextCatId && c.type === nextType,
              );
              if (!isCatValid) nextCatId = undefined;
            }
          }
          return {
            ...r,
            userType: nextType,
            categoryId: nextCatId,
            toAccountId: nextToAccId,
          };
        }),
      );
      popup.success(
        `Set type to ${nextType} for ${count} selected transaction${count === 1 ? "" : "s"}`,
      );
    },
    [categories, popup, toAccountId],
  );

  const handleApplyBulkCategory = useCallback(() => {
    if (!bulkCategory) return;
    const catId = Number(bulkCategory);
    const targetCat = categories.find((c) => c.id === catId);
    if (!targetCat) return;

    let appliedCount = 0;
    setRows((prev) =>
      prev.map((r) => {
        if (!r.excluded && r.userType === targetCat.type) {
          appliedCount++;
          return { ...r, categoryId: catId };
        }
        return r;
      }),
    );

    if (appliedCount > 0) {
      popup.success(
        `Assigned "${targetCat.name}" to ${appliedCount} ${targetCat.type} transaction${appliedCount === 1 ? "" : "s"}`,
      );
    } else {
      popup.warning(
        `No selected ${targetCat.type} transactions found for "${targetCat.name}". Change transaction type to ${targetCat.type} to assign this category.`,
      );
    }
    setBulkCategory("");
  }, [bulkCategory, categories, popup]);

  const handleSelectAll = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, excluded: false })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, excluded: true })));
  }, []);

  const handleAcceptSuggestion = useCallback((key: string) => {
    setRows((prev) =>
      prev.map((r) =>
        getRowKey(r) === key
          ? {
              ...r,
              userType: "transfer",
              categoryId: undefined,
              toAccountId: r.toAccountId ?? (toAccountId ? Number(toAccountId) : undefined),
              suggestionDismissed: true,
            }
          : r,
      ),
    );
  }, [toAccountId]);

  const handleDismissSuggestion = useCallback((key: string) => {
    setRows((prev) =>
      prev.map((r) =>
        getRowKey(r) === key ? { ...r, suggestionDismissed: true } : r,
      ),
    );
  }, []);

  const handleCommit = async () => {
    if (committing) return;
    if (importableCount === 0) {
      setError("No transactions selected for import.");
      return;
    }
    if (transferCount > 0) {
      const activeTransfers = rows.filter((r) => !r.excluded && r.userType === "transfer");
      const unassigned = activeTransfers.find((r) => !r.toAccountId && !toAccountId);
      if (unassigned) {
        setError("Please choose a destination account for all transfer transactions.");
        return;
      }
      const selfTransfer = activeTransfers.find(
        (r) => String(r.toAccountId ?? toAccountId) === String(accountId),
      );
      if (selfTransfer) {
        setError("The destination account must be different from the source account.");
        return;
      }
    }
    setCommitting(true);
    setError(null);
    try {
      const batchId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `batch-${Date.now()}`;

      const payloadTransactions = rows
        .filter((r) => !r.excluded)
        .map((r) => ({
          uuid: r.uuid,
          account_id: Number(accountId),
          type: r.userType,
          amount: Number(r.amount),
          description: r.description,
          transaction_date: r.transaction_date,
          reference: r.reference || null,
          to_account_id:
            r.userType === "transfer"
              ? Number(r.toAccountId ?? toAccountId)
              : null,
          category_id: r.categoryId ?? null,
        }));

      await storeImportTransactions({
        import_batch_id: batchId,
        transactions: payloadTransactions,
      });
      popup.success(`Imported ${importableCount} transaction${importableCount === 1 ? "" : "s"}`);
      setStep("done");
    } catch (err) {
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
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3.5 px-6 shadow-sm border-b border-white/5 transition-all text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-bold text-white tracking-tight">Import Transactions</h1>
            <p className="text-[11px] text-slate-300 font-medium truncate">Batch upload bank statements (CSV, XLSX)</p>
          </div>
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
                Target Account
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 appearance-none outline-none cursor-pointer"
                >
                  <option value="" disabled>Select account</option>
                  {(accounts ?? []).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Transactions from the statement will be added to this account.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                Statement File (CSV, Excel XLSX, PDF)
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-8 text-center space-y-3 transition-colors relative",
                  isDragging
                    ? "border-blue-500 bg-blue-50/60"
                    : file
                    ? "border-blue-200 bg-blue-50/20"
                    : "border-slate-200 bg-slate-50/50 hover:border-blue-400",
                )}
              >
                <input
                  type="file"
                  accept={bankConfig.accepts}
                  onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                {file ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-blue-100 shadow-xs max-w-sm mx-auto">
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileUp size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickFile(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      aria-label="Remove file"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <FileUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Choose a bank statement or drag it here
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports OPay, Kuda, PalmPay (PDF & Excel), Sterling, and other CSV, Excel or PDF statements up to 10MB
                      </p>
                    </div>
                  </>
                )}
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
            <div className="bg-white p-5 rounded-3xl card-shadow border border-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-900">
                  {importableCount} Selected for Import
                </p>
                <p className="text-[10px] text-slate-400">
                  {duplicateCount > 0 ? `${duplicateCount} duplicate(s) flagged · ` : ""}
                  {excludedCount > 0 ? `${excludedCount} excluded` : "all active"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Multi-Sheet Filter Bar (e.g. OPay Wallet & OWealth) */}
            {availableSheets.length > 1 && (
              <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Sheets:</span>
                <button
                  type="button"
                  onClick={() => setSelectedSheet("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                    selectedSheet === "all"
                      ? "bg-[#0b1434] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  All Sheets ({rows.length})
                </button>
                {availableSheets.map((s) => {
                  const count = rows.filter((r) => r.sheet === s).length;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSheet(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                        selectedSheet === s
                          ? "bg-[#0b1434] text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* OWealth Sweeps & Interest Action Banner */}
            {(owealthSweepCount > 0 || owealthInterestCount > 0) && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-orange-50 border border-amber-200/80 p-4 rounded-3xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black text-[11px] shadow-xs">
                      OW
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-slate-900">
                        OPay OWealth Activity Detected
                      </h3>
                      <p className="text-[11px] text-slate-600 font-medium truncate">
                        {owealthSweepCount > 0 && (
                          <span>
                            {owealthSweepCount} internal sweep{owealthSweepCount === 1 ? "" : "s"} ({owealthSweepActiveCount} active) ·{" "}
                          </span>
                        )}
                        {owealthInterestCount > 0 && (
                          <span>
                            {owealthInterestCount} interest payment{owealthInterestCount === 1 ? "" : "s"} ({owealthInterestActiveCount} active)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {owealthSweepCount > 0 && (
                      owealthSweepActiveCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleToggleOWealthSweeps(true)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                        >
                          Exclude Sweeps ({owealthSweepCount})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleOWealthSweeps(false)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors"
                        >
                          Include Sweeps ({owealthSweepCount})
                        </button>
                      )
                    )}

                    {owealthInterestCount > 0 && (
                      owealthInterestActiveCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleToggleOWealthInterest(true)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors"
                        >
                          Exclude Interest ({owealthInterestCount})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleOWealthInterest(false)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors"
                        >
                          Include Interest ({owealthInterestCount})
                        </button>
                      )
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-amber-800/80 leading-relaxed">
                  Internal sweeps auto-transfer funds between your Wallet and OWealth to pay bills or auto-save balances. They are auto-excluded to avoid duplicating income/expenses. Real interest earned is preserved as income.
                </p>
              </div>
            )}

            {/* Bulk Adjustments Toolbar for Type & Category */}
            {importableCount > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-3xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800">
                      Bulk Actions
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ({importableCount} selected)
                    </span>
                  </div>

                  {/* Bulk Type Switchers */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">Set Type:</span>
                    <button
                      type="button"
                      onClick={() => handleBulkSetType("expense")}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetType("income")}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetType("transfer")}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      Transfer
                    </button>
                  </div>
                </div>

                {/* Bulk Category Assignment */}
                {categories.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Assign Category:</span>
                      <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[220px]"
                      >
                        <option value="">Choose category...</option>
                        {expenseCategories.length > 0 && (
                          <optgroup label="Expense Categories">
                            {expenseCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {incomeCategories.length > 0 && (
                          <optgroup label="Income Categories">
                            {incomeCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={handleApplyBulkCategory}
                        disabled={!bulkCategory}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs disabled:opacity-40 hover:bg-blue-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Applies to selected rows matching the category's type
                    </p>
                  </div>
                )}
              </div>
            )}

            {transferCount > 0 && (
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-3xl space-y-2">
                <p className="text-xs font-black text-blue-900 flex items-center gap-2">
                  <ArrowRightLeft size={16} /> Destination for {transferCount} Transfer{transferCount === 1 ? "" : "s"}
                </p>
                <p className="text-[10px] text-blue-700">
                  Select a default destination account (or customize individually per row below):
                </p>
                <div className="relative pt-1">
                  <select
                    value={toAccountId}
                    onChange={(e) => handleBulkToAccountChange(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 appearance-none outline-none cursor-pointer"
                  >
                    <option value="">Select destination account</option>
                    {(accounts ?? [])
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

            <div className="bg-white rounded-3xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-100">
              {rows
                .filter((r) => selectedSheet === "all" || r.sheet === selectedSheet)
                .map((row) => {
                  const key = getRowKey(row);
                  const isDup = row.is_duplicate;
                  const isExcluded = row.excluded;
                  const suggestion = getTransferSuggestion(row.transfer_suggestion);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-4 transition-colors",
                        isExcluded && "opacity-50 bg-slate-50/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Exclude/Include Checkbox */}
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            onChange={() => handleToggleExclude(key)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                            title={isExcluded ? "Click to include" : "Click to exclude"}
                          />

                          {/* Type Icon Button (Click to toggle type) */}
                          <button
                            type="button"
                            onClick={() => handleCycleType(key)}
                            title="Click to cycle type (expense/income/transfer)"
                            className={cn(
                              "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform active:scale-90",
                              getTypeTone(row.userType),
                            )}
                          >
                            {getTypeIcon(row.userType)}
                          </button>

                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{row.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-medium text-slate-400">{row.transaction_date}</span>
                              {row.sheet && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                  {row.sheet}
                                </span>
                              )}
                              {row.isOWealthSweep && (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                  OWealth Sweep {isExcluded ? "(Excluded)" : ""}
                                </span>
                              )}
                              {row.isOWealthInterest && (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  OWealth Interest {isExcluded ? "(Excluded)" : ""}
                                </span>
                              )}
                              {row.reference && (
                                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                  {row.reference}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-slate-900">
                            {renderAmount(row.amount, userCurrency)}
                          </p>
                          {isDup && (
                            <span className="text-[9px] font-bold text-amber-600 uppercase block">
                              Duplicate
                            </span>
                          )}
                          {row.isOWealthSweep && isExcluded && (
                            <span className="text-[9px] font-bold text-amber-600 uppercase block">
                              Sweep Excluded
                            </span>
                          )}
                          {row.dateError && (
                            <span className="text-[9px] font-bold text-red-500 uppercase block">
                              Invalid Date
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row Controls: Type & Category Adjustment */}
                      <div className="mt-2.5 ml-7 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Type Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">Type:</span>
                            <select
                              value={row.userType}
                              onChange={(e) =>
                                handleRowTypeChange(
                                  key,
                                  e.target.value as "income" | "expense" | "transfer",
                                )
                              }
                              aria-label="Transaction Type"
                              className={cn(
                                "text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-xl border outline-none cursor-pointer transition-all",
                                row.userType === "expense" && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100/80",
                                row.userType === "income" && "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80",
                                row.userType === "transfer" && "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100/80",
                              )}
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                              <option value="transfer">Transfer</option>
                            </select>
                          </div>

                          {/* Destination Account (if Transfer) OR Category Selector (if Expense/Income) */}
                          {row.userType === "transfer" ? (
                            <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                              <span className="text-[10px] font-bold text-blue-600 shrink-0">To:</span>
                              <select
                                value={row.toAccountId ?? (toAccountId ? Number(toAccountId) : "")}
                                onChange={(e) =>
                                  handleRowToAccountChange(
                                    key,
                                    e.target.value ? Number(e.target.value) : undefined,
                                  )
                                }
                                aria-label="Destination Account"
                                className={cn(
                                  "text-[11px] font-bold border rounded-xl px-2.5 py-1 outline-none cursor-pointer transition-all max-w-[170px] xs:max-w-[210px] sm:max-w-[260px] truncate",
                                  (row.toAccountId ?? toAccountId)
                                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80"
                                    : "bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-300",
                                )}
                              >
                                <option value="">Select destination...</option>
                                {destinationAccountOptions.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                              <span className="text-[10px] font-bold text-slate-400 shrink-0">Category:</span>
                              <select
                                value={row.categoryId ?? ""}
                                onChange={(e) =>
                                  handleRowCategoryChange(
                                    key,
                                    e.target.value ? Number(e.target.value) : undefined,
                                  )
                                }
                                aria-label="Transaction Category"
                                className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 border-0 rounded-xl px-2.5 py-1 text-slate-700 outline-none cursor-pointer transition-colors max-w-[170px] xs:max-w-[210px] sm:max-w-[260px] truncate"
                              >
                                <option value="">Uncategorized</option>
                                {categories
                                  .filter((c) => c.type === row.userType)
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Smart Transfer Recommendation if detected */}
                      {suggestion && !row.suggestionDismissed && row.userType !== "transfer" && (
                        <div className="mt-2.5 ml-7 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                          <div className="flex items-center gap-1.5 text-blue-900 font-semibold min-w-0">
                            <Sparkles size={13} className="text-blue-600 shrink-0" />
                            <span className="text-[11px] leading-tight">{suggestion.prompt}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAcceptSuggestion(key)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition-colors"
                            >
                              Convert to Transfer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDismissSuggestion(key)}
                              className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 text-[10px] font-medium"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
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
              {committing ? "Importing..." : `Import ${importableCount} Transaction${importableCount === 1 ? "" : "s"}`}
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
                onClick={() => void navigate("/transactions")}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
              >
                View Transactions
              </button>
            </div>
          </div>
        )}
      </main>

      <FinanceNavbar />
    </div>
  );
}
