import { Link, useNavigate, useSearchParams } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { notify } from "@/hooks/use-toast";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Banknote,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Filter as FilterIcon,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  Smartphone,
  Square,
  Trash2,
  Utensils,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Transaction } from "@/lib/finance";
import { DuplicateReviewView } from "@/components/finance/DuplicateReviewView";
import { detectDuplicatePairs } from "@/lib/duplicate-detector";
import {
  ApiError,
  accounts as accountsApi,
  categories as categoriesApi,
  transactions as transactionsApi,
  type AccountDto,
  type CategoryDto,
  type TransactionDto,
  type CreateTransactionInput,
} from "@/lib/api";
import { DEFAULT_CURRENCY, resolveCurrency } from "@/lib/currencies";
import { HistorySkeleton, TransactionsSkeleton } from "@/components/finance/Skeletons";
import { useMe } from "@/hooks/use-me";
import { getUserInitials } from "@/components/finance/ScreenHeader";

type Filter = "all" | "expense" | "income" | "transfer";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expense", label: "Expenses" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfers" },
];

function getIcon(type: Transaction["type"]) {
  if (type === "income") return <ArrowDownLeft size={16} />;
  if (type === "expense") return <ArrowUpRight size={16} />;
  return <ArrowRightLeft size={16} />;
}

function formatTxTime(dateStr?: string): string {
  if (!dateStr) return "12:00 PM";
  const parts = dateStr.split(" ");
  if (parts.length > 1 && parts[1]) {
    const timeParts = parts[1].split(":");
    if (timeParts.length >= 2) {
      let hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
  }
  return "12:00 PM";
}

function getCategoryIcon(type: Transaction["type"], catName?: string) {
  const name = (catName || "").toLowerCase();
  if (name.includes("food") || name.includes("grocer") || name.includes("dining") || name.includes("restaurant") || name.includes("lunch")) {
    return <Utensils size={13} />;
  }
  if (name.includes("airtime") || name.includes("data") || name.includes("phone")) {
    return <Smartphone size={13} />;
  }
  if (name.includes("shop") || name.includes("jumia") || name.includes("cloth") || name.includes("market")) {
    return <CreditCard size={13} />;
  }
  if (name.includes("transport") || name.includes("bus") || name.includes("ride") || name.includes("uber") || name.includes("fuel")) {
    return <ArrowRightLeft size={13} />;
  }
  if (name.includes("bill") || name.includes("util") || name.includes("electric") || name.includes("power")) {
    return <Zap size={13} />;
  }
  if (type === "income") return <ArrowDownLeft size={13} />;
  if (type === "transfer") return <ArrowRightLeft size={13} />;
  return <ReceiptText size={13} />;
}

function formatDateHeader(iso: string) {
  const parts = iso.split("-");
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  }
  return iso;
}

function toTransaction(dto: TransactionDto): Transaction {
  return {
    id: dto.id,
    description: dto.description ?? undefined,
    category: dto.category ? { name: dto.category.name } : undefined,
    transaction_date: dto.transaction_date,
    account: dto.account ? { name: dto.account.name } : undefined,
    toAccount: dto.to_account ? { name: dto.to_account.name } : null,
    type: dto.type,
    amount: typeof dto.amount === "string" ? parseFloat(dto.amount) : dto.amount,
  };
}

function groupByDay(items: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const t of items) {
    const key = t.transaction_date.split(" ")[0]!;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0]! < b[0]! ? 1 : -1));
}

interface SpendingByDayProps {
  transactions: Transaction[];
  currency: string;
  renderAmount: (amount: number, currency: string) => string;
}

function SpendingByDayCard({ transactions, currency, renderAmount }: SpendingByDayProps) {
  const [viewTable, setViewTable] = useState(false);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  const dailyAmounts = useMemo(() => {
    const arr = new Array(daysInMonth).fill(0);
    transactions.forEach((t) => {
      if (t.type !== "expense") return;
      const parts = t.transaction_date.split(" ")[0].split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (y === currentYear && m === currentMonth && d >= 1 && d <= daysInMonth) {
          arr[d - 1] += Number(t.amount) || 0;
        }
      }
    });
    return arr;
  }, [transactions, daysInMonth, currentMonth, currentYear]);

  const maxVal = Math.max(...dailyAmounts, 100);
  const width = 280;
  const height = 110;
  const margin = { left: 24, right: 8, top: 12, bottom: 20 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const band = innerW / daysInMonth;
  const barW = Math.max(2, Math.min(8, band * 0.7));

  return (
    <section className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-3.5 shadow-[var(--lift)] space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-display font-semibold text-[14px] text-[var(--ink)] tracking-tight">
            Spending by day
          </h3>
          <span className="text-[11px] font-semibold text-[var(--muted)]">
            {monthName} pattern
          </span>
        </div>
        <button
          type="button"
          onClick={() => setViewTable((v) => !v)}
          className="text-[11px] font-bold text-[var(--accent)] hover:underline cursor-pointer bg-none border-none p-1 rounded-[var(--r-sm)]"
        >
          {viewTable ? "Chart" : "Table"}
        </button>
      </div>

      {viewTable ? (
        <div className="max-h-[120px] overflow-y-auto text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] border-b border-[var(--line)]">
                <th className="py-1 text-left">Day</th>
                <th className="py-1 text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {dailyAmounts.map((amt, idx) => (
                <tr key={idx} className="border-b border-[var(--line)]/50">
                  <td className="py-1 text-[var(--ink)] font-semibold">
                    {now.toLocaleDateString("en-US", { month: "short" })} {idx + 1}
                  </td>
                  <td className="py-1 text-right font-bold text-[var(--ink)] tabular-nums">
                    {amt > 0 ? renderAmount(amt, currency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-[110px] overflow-visible"
            role="img"
            aria-label="Spending by day"
          >
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={margin.top + innerH}
              y2={margin.top + innerH}
              stroke="var(--line)"
              strokeWidth="1"
            />
            {dailyAmounts.map((val, i) => {
              const bh = val > 0 ? Math.max(3, (val / maxVal) * innerH) : 0;
              const x = margin.left + band * i + (band - barW) / 2;
              const y = margin.top + innerH - bh;
              const day = i + 1;
              const isLabelDay = day === 1 || day === 8 || day === 15 || day === 22 || day === 29;

              return (
                <g key={i}>
                  {bh > 0 && (
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={bh}
                      rx={2}
                      className="fill-[var(--accent)] hover:fill-[var(--primary)] transition-colors"
                    >
                      <title>{`Day ${day}: ${renderAmount(val, currency)}`}</title>
                    </rect>
                  )}
                  {isLabelDay && (
                    <text
                      x={margin.left + band * i + band / 2}
                      y={height - 5}
                      textAnchor="middle"
                      className="fill-[var(--muted)] text-[9px] font-bold"
                    >
                      {day}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

interface TransactionDetailModalProps {
  transaction: TransactionDto;
  accounts: AccountDto[];
  categories: CategoryDto[];
  currency: string;
  isDuplicate: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleteRequest: (dto: TransactionDto) => void;
}

function TransactionDetailModal({
  transaction,
  accounts,
  categories,
  currency,
  isDuplicate,
  onClose,
  onSaved,
  onDeleteRequest,
}: TransactionDetailModalProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(String(typeof transaction.amount === "string" ? parseFloat(transaction.amount) : transaction.amount));
  const [type, setType] = useState<"income" | "expense" | "transfer">(transaction.type);
  const [accountId, setAccountId] = useState(String(transaction.account_id));
  const [toAccountId, setToAccountId] = useState(transaction.to_account_id ? String(transaction.to_account_id) : "");
  const [categoryId, setCategoryId] = useState(transaction.category_id ? String(transaction.category_id) : "");
  const [description, setDescription] = useState(transaction.description ?? "");
  const [date, setDate] = useState(transaction.transaction_date.split(" ")[0] || transaction.transaction_date);
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountSymbol = resolveCurrency(currency)?.symbol ?? currency;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`pasona.tx_meta:${transaction.id}`);
      if (raw) {
        const m = JSON.parse(raw);
        setTags(m.tags ?? "");
        setNote(m.note ?? "");
      }
    } catch {
      // ignore
    }
  }, [transaction.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!accountId) {
      setError("Please select an account.");
      return;
    }

    if (type === "transfer" && (!toAccountId || toAccountId === accountId)) {
      setError("Pick a different destination account for the transfer.");
      return;
    }

    const payload: Partial<CreateTransactionInput> = {
      account_id: Number(accountId),
      type,
      amount: num,
      description: description.trim() || undefined,
      transaction_date: date,
    };
    if (type === "transfer") {
      payload.to_account_id = Number(toAccountId);
    } else if (categoryId) {
      payload.category_id = Number(categoryId);
    }

    setIsSubmitting(true);
    try {
      await transactionsApi.updateTransaction(transaction.id, payload);
      try {
        localStorage.setItem(
          `pasona.tx_meta:${transaction.id}`,
          JSON.stringify({ tags: tags.trim(), note: note.trim() })
        );
      } catch {
        // ignore
      }
      notify.success("Transaction updated");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isT = type === "transfer";
  const titleText = isT ? "Transfer" : type === "income" ? "Income" : "Expense";

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(8,12,40,0.5)] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full sm:max-w-[480px] bg-[var(--surface)] border border-[var(--line)] rounded-t-[var(--r-xl)] sm:rounded-[var(--r-xl)] shadow-[var(--lift)] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-[var(--ink)]">
              {titleText}
            </h3>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/transactions/${transaction.id}`);
              }}
              className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1 rounded-[var(--r-sm)]"
              title="Open full page"
            >
              <ExternalLink size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-3">
          {isDuplicate && (
            <div className="bg-[var(--info-soft)] text-[var(--accent)] rounded-[var(--r-md)] p-2.5 flex items-center gap-2 text-xs font-semibold">
              <ShieldAlert size={16} className="shrink-0" />
              <span>Possible duplicate: A matching row was detected in history.</span>
            </div>
          )}

          {/* Amount Input */}
          <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-3 py-2">
            <span className="font-display text-2xl font-bold text-[var(--muted)]">
              {amountSymbol}
            </span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border-none outline-none font-display text-2xl font-bold text-[var(--ink)] tabular-nums"
              placeholder="0.00"
              autoFocus
            />
          </div>

          {/* Type Segmented Control */}
          <div className="grid grid-cols-3 gap-1 bg-[var(--chip)] p-1 rounded-[var(--r-sm)] text-xs font-bold">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "py-1.5 rounded-[var(--r-sm)] text-center capitalize transition-colors cursor-pointer",
                  type === t
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Accounts & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="tx-acc" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {isT ? "From Account" : type === "income" ? "Received Into" : "Paid From"}
              </label>
              <select
                id="tx-acc"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {isT ? (
              <div className="space-y-1">
                <label htmlFor="tx-to" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  To Account
                </label>
                <select
                  id="tx-to"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] cursor-pointer"
                >
                  <option value="">Select target</option>
                  {accounts
                    .filter((a) => String(a.id) !== accountId)
                    .map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label htmlFor="tx-cat" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Category
                </label>
                <select
                  id="tx-cat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] cursor-pointer"
                >
                  <option value="">Uncategorized</option>
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="tx-date" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="tx-desc" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Description
              </label>
              <input
                id="tx-desc"
                type="text"
                placeholder="e.g. groceries"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label htmlFor="tx-tags" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Tags
            </label>
            <input
              id="tx-tags"
              type="text"
              placeholder="e.g. school, urgent"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
            />
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label htmlFor="tx-note" className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Note
            </label>
            <textarea
              id="tx-note"
              rows={2}
              placeholder="Anything worth remembering"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] p-2.5 text-xs font-semibold text-[var(--ink)] resize-none"
            />
          </div>

          {/* Source meta */}
          <div className="text-[11px] font-semibold text-[var(--muted)] pt-1">
            {transaction.reference?.toLowerCase().includes("csv")
              ? "Imported statement row"
              : transaction.reference?.toLowerCase().includes("alert")
              ? "Logged from bank alert"
              : "Directly logged"}{" "}
            · {formatDateHeader(date)}
          </div>

          {error && (
            <div className="text-xs font-bold text-[var(--neg)] pt-1">
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => onDeleteRequest(transaction)}
              className="w-9 h-9 rounded-[var(--r-sm)] border border-rose-200 bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
              title="Delete transaction"
            >
              <Trash2 size={15} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-[var(--r-sm)] bg-[var(--primary)] text-white text-xs font-bold hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TransactionsIndex() {
  const { data: user } = useMe();
  const { isRevealed, renderAmount } = usePrivacyMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("category_id");
  const accountIdParam = searchParams.get("account_id");
  const duplicateFlag =
    searchParams.get("flag") === "duplicates" ||
    searchParams.get("tab") === "duplicates" ||
    searchParams.get("view") === "duplicates";
  const [viewMode, setViewMode] = useState<"history" | "duplicates">("history");
  const isDuplicateView = viewMode === "duplicates" || duplicateFlag;

  const [txDtos, setTxDtos] = useState<TransactionDto[]>([]);
  const [accountsList, setAccountsList] = useState<AccountDto[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryIdParam || "all");
  const [selectedAccount, setSelectedAccount] = useState<string>(accountIdParam || "all");
  const [dateFilter, setDateFilter] = useState("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [showF, setShowF] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active transaction detail modal
  const [activeModalDto, setActiveModalDto] = useState<TransactionDto | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionDto | null>(null);
  const [openMenuTxId, setOpenMenuTxId] = useState<string | null>(null);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (categoryIdParam) setSelectedCategory(categoryIdParam);
  }, [categoryIdParam]);

  useEffect(() => {
    if (accountIdParam) setSelectedAccount(accountIdParam);
  }, [accountIdParam]);

  const [savedFilters, setSavedFilters] = useState<
    {
      id: string;
      name: string;
      type?: Filter;
      search?: string;
      dateFilter?: string;
      category?: string;
      account?: string;
      minAmount?: string;
    }[]
  >(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("pasona.saved_filters");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const isFilterActive =
    filter !== "all" ||
    Boolean(search.trim()) ||
    dateFilter !== "all" ||
    selectedCategory !== "all" ||
    selectedAccount !== "all" ||
    Boolean(minAmount);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [txRes, accData, catData] = await Promise.all([
        transactionsApi.listTransactions({ per_page: 500 }),
        accountsApi.listAccounts(),
        categoriesApi.listCategories(),
      ]);
      setTxDtos(Array.isArray(txRes) ? txRes : (txRes.data ?? []));
      setAccountsList(accData);
      setCategoriesList(catData);
    } catch (err) {
      if (err instanceof ApiError) setError(err);
      else
        setError(
          new ApiError({
            message: "Failed to load transactions",
            status: 500,
          })
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const transactions = useMemo(() => txDtos.map(toTransaction), [txDtos]);

  const openDuplicatePairs = useMemo(() => {
    return detectDuplicatePairs(txDtos);
  }, [txDtos]);

  const duplicateTransactions = useMemo(() => {
    const duplicateIds = new Set<number>();
    for (const pair of openDuplicatePairs) {
      if (pair.kind === "dup") {
        duplicateIds.add(pair.a.id);
        duplicateIds.add(pair.b.id);
      }
    }
    return transactions.filter((t) => duplicateIds.has(Number(t.id)));
  }, [openDuplicatePairs, transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;

      if (selectedAccount !== "all") {
        const rawDto = txDtos.find((dto) => dto.id === t.id);
        const matchesAccount =
          String(rawDto?.account_id) === selectedAccount ||
          String(rawDto?.to_account_id) === selectedAccount;
        if (!matchesAccount) return false;
      }

      if (selectedCategory !== "all") {
        const rawDto = txDtos.find((dto) => dto.id === t.id);
        if (String(rawDto?.category_id) !== selectedCategory) return false;
      }

      if (minAmount) {
        const minVal = parseFloat(minAmount);
        if (!isNaN(minVal) && Number(t.amount) < minVal) return false;
      }

      if (dateFilter !== "all") {
        const txDate = new Date(t.transaction_date);
        const now = new Date();

        if (dateFilter === "month") {
          if (
            txDate.getMonth() !== now.getMonth() ||
            txDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (dateFilter === "30") {
          const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 30 || diffDays < 0) return false;
        } else if (dateFilter === "7") {
          const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 7 || diffDays < 0) return false;
        } else if (dateFilter === "today") {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          if (txDate.toDateString() !== yesterday.toDateString()) return false;
        } else if (dateFilter === "custom" && customFrom && customTo) {
          const from = new Date(customFrom);
          const to = new Date(customTo);
          to.setHours(23, 59, 59, 999);
          if (txDate < from || txDate > to) return false;
        }
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category?.name || "").toLowerCase();
        const acc = (t.account?.name || "").toLowerCase();
        const toAcc = (t.toAccount?.name || "").toLowerCase();
        const amtStr = String(t.amount);

        const matches =
          desc.includes(query) ||
          cat.includes(query) ||
          acc.includes(query) ||
          toAcc.includes(query) ||
          amtStr.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    transactions,
    txDtos,
    filter,
    selectedAccount,
    selectedCategory,
    minAmount,
    dateFilter,
    customFrom,
    customTo,
    search,
  ]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const allTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else if (t.type === "expense") expense += amt;
    }
    return { income, expense, count: transactions.length };
  }, [transactions]);

  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else if (t.type === "expense") expense += amt;
    }
    return { income, expense };
  }, [filtered]);

  const incomeCount = useMemo(
    () => transactions.filter((t) => t.type === "income").length,
    [transactions]
  );
  const expenseCount = useMemo(
    () => transactions.filter((t) => t.type === "expense").length,
    [transactions]
  );
  const netCashFlow = allTotals.income - allTotals.expense;

  const totalAcrossAccounts = useMemo(
    () => accountsList.reduce((sum, a) => sum + (Number(a.balance) || 0), 0),
    [accountsList]
  );

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    let totalSpent = 0;
    for (const t of filtered) {
      if (t.type === "expense") {
        const cat = t.category?.name || "Uncategorized";
        const amt = Number(t.amount) || 0;
        map.set(cat, (map.get(cat) || 0) + amt);
        totalSpent += amt;
      }
    }
    const items = Array.from(map.entries())
      .map(([name, total]) => ({
        name,
        total,
        pct: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
    return { items: items.slice(0, 4), totalSpent };
  }, [filtered]);

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedFiltered = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const pagedGrouped = useMemo(() => groupByDay(pagedFiltered), [pagedFiltered]);

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTxIds.size === pagedFiltered.length && pagedFiltered.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(pagedFiltered.map((t) => t.id)));
    }
  };

  const resetFilters = () => {
    setFilter("all");
    setSelectedCategory("all");
    setSelectedAccount("all");
    setDateFilter("all");
    setMinAmount("");
    setCustomFrom("");
    setCustomTo("");
    setSearch("");
    setCurrentPage(1);
    setSelectedTxIds(new Set());
  };

  const saveCurrentFilter = () => {
    const filterName = prompt("Name this filter:", `Filter ${savedFilters.length + 1}`);
    if (!filterName || !filterName.trim()) return;

    const newFilter = {
      id: String(Date.now()),
      name: filterName.trim(),
      type: filter,
      search,
      dateFilter,
      category: selectedCategory,
      account: selectedAccount,
      minAmount,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    try {
      localStorage.setItem("pasona.saved_filters", JSON.stringify(updated));
      notify.success("Filter saved");
    } catch {
      // ignore
    }
  };

  const applySavedFilter = (sf: (typeof savedFilters)[0]) => {
    if (sf.type) setFilter(sf.type);
    if (sf.search !== undefined) setSearch(sf.search);
    if (sf.dateFilter) setDateFilter(sf.dateFilter);
    if (sf.category) setSelectedCategory(sf.category);
    if (sf.account) setSelectedAccount(sf.account);
    if (sf.minAmount !== undefined) setMinAmount(sf.minAmount);
  };

  const deleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    try {
      localStorage.setItem("pasona.saved_filters", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      await transactionsApi.deleteTransaction(Number(deletingTransaction.id));
      setTxDtos((prev) => prev.filter((t) => t.id !== deletingTransaction.id));
      notify.success("Transaction removed");
      if (activeModalDto?.id === deletingTransaction.id) {
        setActiveModalDto(null);
      }
    } catch {
      notify.error("Failed to delete transaction");
    } finally {
      setDeletingTransaction(null);
    }
  };

  const userCurrency = user?.currency || DEFAULT_CURRENCY;

  const subtitle = useMemo(() => {
    if (dateFilter === "month") return "This month";
    if (dateFilter === "30") return "Last 30 days";
    if (dateFilter === "7") return "Last 7 days";
    if (dateFilter === "today") return "Today";
    if (dateFilter === "yesterday") return "Yesterday";
    return "All time";
  }, [dateFilter]);

  if (loading && transactions.length === 0) {
    return <HistorySkeleton />;
  }

  if (isDuplicateView) {
    return (
      <main className="p-4 sm:p-6 max-w-5xl mx-auto">
        <DuplicateReviewView
          transactions={txDtos}
          userCurrency={userCurrency}
          onRefresh={loadData}
          onBack={() => {
            setViewMode("history");
            if (duplicateFlag) {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("flag");
                next.delete("tab");
                next.delete("view");
                return next;
              });
            }
          }}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      {/* ===================================================================
          Header Bar: Clean, institutional layout
          =================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-3 sm:px-5 lg:px-6 shadow-sm border-b border-white/5 text-white">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-xl sm:text-2xl text-white tracking-tight leading-tight truncate">
              Transaction history
            </h1>
            <div className="text-[11px] font-semibold text-white/70 mt-0.5">
              View and manage all your income and expenses
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Date range dropdown button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDateDropdown((v) => !v)}
                className="h-8 px-2.5 rounded-[var(--r-sm)] bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Date range"
              >
                <Calendar size={13} className="text-white/80" />
                <span>{subtitle}</span>
                <ChevronDown size={13} className="text-white/60 ml-0.5" />
              </button>

              {showDateDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowDateDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-44 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-sm)] shadow-[var(--lift)] py-1 text-xs font-semibold text-[var(--ink)] animate-in fade-in zoom-in-95 duration-100">
                    {[
                      { id: "all", label: "All time" },
                      { id: "month", label: "This month" },
                      { id: "30", label: "Last 30 days" },
                      { id: "7", label: "Last 7 days" },
                      { id: "today", label: "Today" },
                      { id: "yesterday", label: "Yesterday" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDateFilter(d.id);
                          setShowDateDropdown(false);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--chip)] transition-colors cursor-pointer",
                          dateFilter === d.id && "text-[var(--primary)] font-bold bg-[var(--chip)]"
                        )}
                      >
                        <span>{d.label}</span>
                        {dateFilter === d.id && <Check size={13} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/60" />
              <input
                ref={searchInputRef}
                id="header-search"
                type="search"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-8 pr-7 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/10 rounded-[var(--r-sm)] text-xs text-white placeholder-white/50 outline-none w-36 sm:w-48 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button for Min Amount / Custom Range */}
            <button
              type="button"
              onClick={() => setShowF((prev) => !prev)}
              className={cn(
                "w-8 h-8 rounded-[var(--r-sm)] flex items-center justify-center transition-colors cursor-pointer",
                showF || minAmount || dateFilter === "custom"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              )}
              aria-label="More filters"
              aria-pressed={showF}
              title="Filter by amount & custom dates"
            >
              <FilterIcon size={14} />
            </button>

            {/* Add Transaction Button */}
            <Link
              to="/transactions/add"
              className="h-8 px-2.5 rounded-[var(--r-sm)] bg-[var(--add)] text-[var(--add-ink)] flex items-center gap-1.5 font-bold text-xs hover:brightness-105 transition-all shadow-sm"
              aria-label="Add Transaction"
            >
              <Plus size={14} strokeWidth={2.8} />
              <span className="hidden sm:inline">Add transaction</span>
            </Link>

            {/* Mobile Settings */}
            <Link
              to="/settings"
              className="w-8 h-8 rounded-[var(--r-sm)] border border-white/10 bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all md:hidden"
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon size={14} />
            </Link>

            {/* User Profile Avatar */}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-[var(--r-sm)] bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center transition-transform active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white/50 shadow-sm"
              aria-label="User Profile"
              title={`Profile: ${user?.name || "User"}`}
            >
              {getUserInitials(user?.name, user?.email)}
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================================
          Main Container: 3 Top KPI Cards, Filter Bar, 2-Column Grid
          =================================================================== */}
      <main className="w-full px-3 sm:px-5 lg:px-6 pt-4 pb-20 space-y-4">
        {/* Top Row: 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total income */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-3.5 shadow-[var(--lift)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Total income
              </div>
              <div className="font-display font-bold text-lg text-[var(--pos)] leading-tight">
                +{renderAmount(allTotals.income, userCurrency)}
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {incomeCount} {incomeCount === 1 ? "transaction" : "transactions"}
              </div>
            </div>
          </div>

          {/* Card 2: Total spent */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-3.5 shadow-[var(--lift)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Total spent
              </div>
              <div className="font-display font-bold text-lg text-[var(--ink)] leading-tight">
                {renderAmount(allTotals.expense, userCurrency)}
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {expenseCount} {expenseCount === 1 ? "transaction" : "transactions"}
              </div>
            </div>
          </div>

          {/* Card 3: Net cash flow */}
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-3.5 shadow-[var(--lift)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Net cash flow
              </div>
              <div
                className={cn(
                  "font-display font-bold text-lg leading-tight",
                  netCashFlow >= 0 ? "text-[var(--pos)]" : "text-[var(--neg)]"
                )}
              >
                {netCashFlow >= 0 ? "+" : "−"}
                {renderAmount(Math.abs(netCashFlow), userCurrency)}
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                This period
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row: Type segmented tabs + Account and Category dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Type Chips */}
          <div className="chips">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={filter === f.id}
                onClick={() => {
                  setFilter(f.id);
                  setCurrentPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Right: Dropdowns + Duplicate Review Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {openDuplicatePairs.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode("duplicates")}
                className="px-2.5 py-1.5 rounded-[var(--r-sm)] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold hover:bg-amber-500/25 transition-all cursor-pointer"
              >
                <ShieldAlert size={14} />
                <span>{openDuplicatePairs.length} duplicates to review</span>
              </button>
            )}

            {/* Account Dropdown */}
            <select
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] cursor-pointer shadow-xs"
            >
              <option value="all">All accounts</option>
              {accountsList.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] cursor-pointer shadow-xs"
            >
              <option value="all">All categories</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>

            {isFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold text-[var(--accent)] hover:underline shrink-0 cursor-pointer px-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel (if showF) */}
        {showF && (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-3.5 shadow-[var(--lift)] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="f-min"
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1"
              >
                Smallest amount
              </label>
              <input
                id="f-min"
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
                inputMode="decimal"
                placeholder="0"
                value={minAmount}
                onChange={(e) => {
                  setMinAmount(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div>
              <label
                htmlFor="f-range"
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1"
              >
                Date preset
              </label>
              <select
                id="f-range"
                className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] cursor-pointer"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All time</option>
                <option value="month">This month</option>
                <option value="30">Last 30 days</option>
                <option value="7">Last 7 days</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {dateFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2 py-1 text-xs"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[var(--r-sm)] px-2 py-1 text-xs"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2-Column Responsive Layout (.hist) */}
        <div className="hist">
          {/* Column 1: Transactions Table Card */}
          <section className="listwrap order-2 lg:order-1" aria-label="Transactions List">
            <div className="flex items-center justify-between py-2 border-b border-[var(--line)]">
              <h2 className="font-display font-semibold text-base text-[var(--ink)]">
                Transactions
              </h2>
              {isFilterActive && (
                <div className="text-xs text-[var(--muted)] font-semibold">
                  {filtered.length} {filtered.length === 1 ? "result" : "results"}
                  {isRevealed &&
                    ` · Out ${renderAmount(filteredTotals.expense, userCurrency)} · In ${renderAmount(filteredTotals.income, userCurrency)}`}
                </div>
              )}
            </div>

            {/* Table Column Headers (desktop) */}
            <div className="hidden sm:grid grid-cols-[32px_90px_1fr_140px_130px_110px_32px] gap-2 py-2 text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] border-b border-[var(--line)] items-center">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  title="Select all on page"
                >
                  {selectedTxIds.size > 0 && selectedTxIds.size === pagedFiltered.length ? (
                    <CheckSquare size={14} className="text-[var(--primary)]" />
                  ) : (
                    <Square size={14} />
                  )}
                </button>
              </div>
              <div>Date & time</div>
              <div>Description</div>
              <div>Category</div>
              <div>Account</div>
              <div className="text-right">Amount</div>
              <div />
            </div>

            {/* Transactions Feed */}
            <div className="list" id="hlist">
              {error && (
                <div className="p-3 my-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-[var(--r-sm)] text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={15} />
                  {error.message}
                </div>
              )}

              {loading && transactions.length === 0 && <TransactionsSkeleton />}

              {!loading && filtered.length === 0 && (
                <div className="empty">
                  <span className="eic">
                    <ReceiptText size={22} />
                  </span>
                  <b>{isFilterActive ? "Nothing matches" : "No transactions yet"}</b>
                  <p>
                    {isFilterActive
                      ? "Try a different word or clear the filters."
                      : "Add one by hand, paste a bank alert or import a statement."}
                  </p>
                  <div className="eact">
                    {isFilterActive ? (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="px-3 py-1.5 rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--surface)] text-xs font-bold cursor-pointer hover:bg-[var(--chip)]"
                      >
                        Clear filters
                      </button>
                    ) : (
                      <Link
                        to="/transactions/add"
                        className="px-3.5 py-2 rounded-[var(--r-sm)] bg-[var(--primary)] text-white text-xs font-bold hover:brightness-105"
                      >
                        Add transaction
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Grouped Day Clusters */}
              {pagedGrouped.map(([day, items]) => {
                const dayNet = items.reduce((sum, item) => {
                  const amt = Number(item.amount) || 0;
                  if (item.type === "income") return sum + amt;
                  if (item.type === "expense") return sum - amt;
                  return sum;
                }, 0);

                return (
                  <div key={day} className="mb-2">
                    {/* Day separator header (.day) */}
                    <div className="day flex items-center justify-between text-xs py-2 px-1 font-bold border-b border-[var(--line)] text-[var(--muted)]">
                      <div className="flex items-center gap-2">
                        <span>{formatDateHeader(day)}</span>
                      </div>
                      <span
                        className={cn(
                          "font-mono text-[11px]",
                          dayNet > 0
                            ? "text-[var(--pos)]"
                            : dayNet < 0
                            ? "text-[var(--neg)]"
                            : "text-[var(--muted)]"
                        )}
                      >
                        Total: {dayNet > 0 ? "+" : dayNet < 0 ? "−" : ""}
                        {renderAmount(Math.abs(dayNet), userCurrency)}
                      </span>
                    </div>

                    {/* Transactions for this day */}
                    {items.map((tx) => {
                      const rawDto = txDtos.find((d) => d.id === tx.id) ?? null;
                      const isIncome = tx.type === "income";
                      const isExpense = tx.type === "expense";
                      const isDuplicate = duplicateTransactions.some((d) => d.id === tx.id);
                      const isSelected = selectedTxIds.has(tx.id);

                      const ref = rawDto?.reference?.toLowerCase() ?? "";
                      const sourceBadge =
                        ref.includes("csv") || ref.includes("import")
                          ? "Imported"
                          : ref.includes("alert")
                          ? "From alert"
                          : null;

                      return (
                        <div
                          key={tx.id}
                          className="relative flex items-center group/row border-t border-[var(--line)] first:border-t-0 hover:bg-[var(--chip)] rounded-[var(--r-sm)] px-1 py-1.5 transition-colors gap-2"
                        >
                          {/* Row Checkbox */}
                          <div className="hidden sm:flex justify-center w-6 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectTx(tx.id);
                              }}
                              className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={14} className="text-[var(--primary)]" />
                              ) : (
                                <Square size={14} />
                              )}
                            </button>
                          </div>

                          {/* Clickable Row Body */}
                          <button
                            type="button"
                            onClick={() => {
                              if (rawDto) setActiveModalDto(rawDto);
                            }}
                            className="flex-1 flex flex-col sm:grid sm:grid-cols-[80px_1fr_140px_130px_100px] gap-2 items-start sm:items-center text-left min-w-0 cursor-pointer bg-none border-none p-0"
                            aria-label={`View transaction ${tx.description || "item"}`}
                          >
                            {/* Date & Time */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn("txi", tx.type, "w-7 h-7 shrink-0")}>
                                {getCategoryIcon(tx.type, tx.category?.name)}
                              </span>
                              <span className="text-[11px] font-semibold text-[var(--muted)] font-mono">
                                {formatTxTime(tx.transaction_date)}
                              </span>
                            </div>

                            {/* Description & subline */}
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-xs text-[var(--ink)] truncate">
                                {tx.description ||
                                  (tx.type === "transfer" ? "Transfer" : "Transaction")}
                              </div>
                              <div className="text-[11px] text-[var(--muted)] truncate">
                                {tx.account?.name && <span>{tx.account.name}</span>}
                                {sourceBadge && <span> · {sourceBadge}</span>}
                                {isDuplicate && (
                                  <span className="ml-1.5 text-amber-500 font-bold">
                                    Possible duplicate
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Category Pill */}
                            <div className="hidden sm:block truncate">
                              {tx.category?.name ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-sm)] bg-[var(--chip)] text-[var(--ink)] text-[11px] font-semibold truncate max-w-[130px]">
                                  {getCategoryIcon(tx.type, tx.category.name)}
                                  <span className="truncate">{tx.category.name}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-[var(--muted)]">—</span>
                              )}
                            </div>

                            {/* Account Badge */}
                            <div className="hidden sm:block truncate text-xs text-[var(--muted)] font-semibold">
                              {tx.account?.name || "—"}
                            </div>

                            {/* Amount */}
                            <div
                              className={cn(
                                "font-bold text-xs font-mono text-left sm:text-right shrink-0",
                                tx.type
                              )}
                            >
                              {isIncome ? "+" : isExpense ? "−" : ""}
                              {renderAmount(tx.amount, userCurrency)}
                            </div>
                          </button>

                          {/* 3-dots action menu */}
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuTxId(openMenuTxId === tx.id ? null : tx.id);
                              }}
                              className={cn(
                                "w-7 h-7 rounded-[var(--r-sm)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--chip)] transition-colors cursor-pointer",
                                openMenuTxId === tx.id && "bg-[var(--chip)] text-[var(--ink)]"
                              )}
                              aria-label="Transaction actions"
                              title="Options"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {openMenuTxId === tx.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuTxId(null);
                                  }}
                                />
                                <div
                                  className="absolute right-0 top-full mt-1 z-40 w-32 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-sm)] shadow-[var(--lift)] py-1 text-xs font-semibold animate-in fade-in zoom-in-95 duration-100"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuTxId(null);
                                      if (rawDto) setActiveModalDto(rawDto);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 text-[var(--ink)] hover:bg-[var(--chip)] text-left cursor-pointer transition-colors"
                                  >
                                    <Pencil size={13} className="text-[var(--muted)]" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuTxId(null);
                                      if (rawDto) setDeletingTransaction(rawDto);
                                    }}
                                    className="w-full px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50 text-left cursor-pointer transition-colors"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between pt-3 pb-1 border-t border-[var(--line)] text-xs font-semibold text-[var(--muted)]">
                <div>
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}{" "}
                  transactions
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-[var(--r-sm)] border border-[var(--line)] flex items-center justify-center hover:bg-[var(--chip)] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "w-7 h-7 rounded-[var(--r-sm)] text-xs font-bold transition-colors cursor-pointer",
                            currentPage === pageNum
                              ? "bg-[var(--primary)] text-white"
                              : "border border-[var(--line)] hover:bg-[var(--chip)] text-[var(--ink)]"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="px-1 text-[var(--muted)]">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="w-7 h-7 rounded-[var(--r-sm)] border border-[var(--line)] flex items-center justify-center hover:bg-[var(--chip)] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Column 2: Stacked Sidebar Cards */}
          <aside className="aside order-1 lg:order-2 space-y-4">
            {/* Redesign Duplicate Guard Alert Banner */}
            {openDuplicatePairs.length > 0 && (
              <div className="dup flex items-center gap-2.5 p-3 rounded-xl bg-[var(--info-soft)] text-[var(--ink)] border border-[var(--line)]">
                <ShieldAlert size={18} className="text-[var(--primary)] shrink-0" />
                <div className="grow min-w-0">
                  <b className="block text-xs font-bold text-[var(--ink)]">
                    {openDuplicatePairs.length}{" "}
                    {openDuplicatePairs.length === 1 ? "item" : "items"} to review
                  </b>
                  <span className="text-[11px] text-[var(--muted)]">
                    Possible duplicates and transfers
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("duplicates")}
                  className="font-extrabold text-xs text-[var(--accent-text)] hover:underline cursor-pointer px-1 py-0.5"
                >
                  Review
                </button>
              </div>
            )}

            {/* Card 1: Your accounts */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-sm text-[var(--ink)] tracking-tight">
                  Your accounts
                </h3>
                <Link
                  to="/accounts"
                  className="text-xs font-bold text-[var(--accent)] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-1.5">
                {accountsList.map((a) => {
                  const isWallet =
                    a.type === "mobile" ||
                    a.name.toLowerCase().includes("opay") ||
                    a.name.toLowerCase().includes("palmpay");
                  const isBank =
                    a.type === "bank" ||
                    a.name.toLowerCase().includes("zenith") ||
                    a.name.toLowerCase().includes("gtb");
                  const numMask = a.account_number
                    ? `${a.account_number.slice(0, 4)} **** ${a.account_number.slice(-4)}`
                    : a.type;
                  return (
                    <Link
                      key={a.id}
                      to={`/accounts/${a.id}`}
                      className="flex items-center justify-between p-2 rounded-[var(--r-sm)] hover:bg-[var(--chip)] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--info-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                          {isWallet ? (
                            <Wallet size={15} />
                          ) : isBank ? (
                            <CreditCard size={15} />
                          ) : (
                            <Banknote size={15} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[var(--ink)] truncate group-hover:text-[var(--primary)]">
                            {a.name}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] font-mono">
                            {numMask}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-xs text-[var(--pos)] font-mono">
                          {renderAmount(Number(a.balance) || 0, userCurrency)}
                        </span>
                        <ChevronRight
                          size={13}
                          className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--muted)]">Total across accounts</span>
                <span className="font-display font-bold text-sm text-[var(--ink)] font-mono">
                  {renderAmount(totalAcrossAccounts, userCurrency)}
                </span>
              </div>
            </div>

            {/* Card 2: Spending by category */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 shadow-[var(--lift)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-sm text-[var(--ink)] tracking-tight">
                  Spending by category
                </h3>
                <Link
                  to="/categories"
                  className="text-xs font-bold text-[var(--accent)] hover:underline"
                >
                  View details
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* SVG Donut */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="var(--line)"
                      strokeWidth="4"
                    />
                    {(() => {
                      let accumulatedPercent = 0;
                      return categoryBreakdown.items.map((cat, i) => {
                        const strokeDasharray = `${cat.pct} ${100 - cat.pct}`;
                        const strokeDashoffset = -accumulatedPercent;
                        accumulatedPercent += cat.pct;
                        const colors = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#ef4444"];
                        return (
                          <circle
                            key={cat.name}
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth="4"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="font-display font-bold text-[13px] text-[var(--ink)] leading-tight font-mono">
                      {renderAmount(categoryBreakdown.totalSpent, userCurrency)}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-[var(--muted)]">
                      Total spent
                    </span>
                  </div>
                </div>

                {/* Legend items */}
                <div className="flex-1 w-full space-y-1.5 text-xs">
                  {categoryBreakdown.items.map((cat, i) => {
                    const colors = ["#f59e0b", "#3b82f6", "#a855f7", "#10b981", "#ef4444"];
                    return (
                      <div key={cat.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: colors[i % colors.length] }}
                          />
                          <span className="truncate text-xs font-semibold text-[var(--ink)]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          <span className="text-[var(--muted)] font-mono text-[11px]">
                            {cat.pct}%
                          </span>
                          <span className="font-bold text-[var(--ink)] font-mono">
                            {renderAmount(cat.total, userCurrency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Quick actions */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-md)] p-4 shadow-[var(--lift)] space-y-2">
              <h3 className="font-display font-semibold text-sm text-[var(--ink)] tracking-tight">
                Quick actions
              </h3>
              <div className="space-y-1.5">
                <Link
                  to="/transactions/add?type=expense"
                  className="flex items-center justify-between p-2.5 rounded-[var(--r-sm)] hover:bg-[var(--chip)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--r-sm)] bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--ink)] group-hover:text-[var(--primary)]">
                        Add expense
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        Record a purchase or payment
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/transactions/add?type=income"
                  className="flex items-center justify-between p-2.5 rounded-[var(--r-sm)] hover:bg-[var(--chip)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--r-sm)] bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <ArrowDownLeft size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--ink)] group-hover:text-[var(--primary)]">
                        Add income
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        Log money received
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>

                <Link
                  to="/transactions/add?type=transfer"
                  className="flex items-center justify-between p-2.5 rounded-[var(--r-sm)] hover:bg-[var(--chip)] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[var(--r-sm)] bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                      <ArrowRightLeft size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--ink)] group-hover:text-[var(--primary)]">
                        Transfer
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">
                        Move money between accounts
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Transaction Details Modal strictly modeled on mockup lines 1951-1965 */}
      {activeModalDto && (
        <TransactionDetailModal
          transaction={activeModalDto}
          accounts={accountsList}
          categories={categoriesList}
          currency={userCurrency}
          isDuplicate={duplicateTransactions.some((d) => d.id === activeModalDto.id)}
          onClose={() => setActiveModalDto(null)}
          onSaved={() => {
            void loadData();
          }}
          onDeleteRequest={(dto) => setDeletingTransaction(dto)}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDestructiveDialog
        open={!!deletingTransaction}
        onOpenChange={(open) => {
          if (!open) setDeletingTransaction(null);
        }}
        title="Delete transaction?"
        description={`This will remove "${deletingTransaction?.description || "this transaction"}" and update your account balance.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
