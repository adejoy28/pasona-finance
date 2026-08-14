import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  FileText,
  Hash,
  Pencil,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/finance";
import { ApiError, transactions as transactionsApi, type TransactionDto } from "@/lib/api";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { TransactionDialog } from "@/components/finance/TransactionDialog";
import { useMe } from "@/hooks/use-me";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getHeroGradient(type: string) {
  if (type === "income") return "from-emerald-500 to-teal-600";
  if (type === "expense") return "from-rose-500 to-pink-600";
  return "from-indigo-500 to-violet-600";
}

function getTypeIcon(type: string) {
  if (type === "income") return <ArrowDownLeft size={22} className="text-white" />;
  if (type === "expense") return <ArrowUpRight size={22} className="text-white" />;
  return <ArrowRightLeft size={22} className="text-white" />;
}

function formatDateMedium(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function DetailCell({
  icon,
  tile,
  label,
  value,
}: {
  icon: ReactNode;
  tile: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", tile)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-xs font-bold text-slate-900 mt-0.5 truncate" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 28 } },
};

export function TransactionDetail() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const popup = usePopup();

  const [dto, setDto] = useState<TransactionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;

  const loadDetail = async () => {
    if (!transactionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await transactionsApi.getTransaction(Number(transactionId));
      setDto(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load transaction details.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Transaction Detail — Pasona";
    void loadDetail();
  }, [transactionId]);

  const confirmDelete = async () => {
    if (!dto) return;
    setIsDeleting(true);
    try {
      await transactionsApi.deleteTransaction(dto.id);
      popup.success("Transaction deleted");
      void navigate("/transactions", { replace: true });
    } catch (err) {
      popup.error(
        err instanceof ApiError ? err.message : "Unable to delete transaction. Please try again.",
      );
    } finally {
      setIsDeleting(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-[var(--navy-900)] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading details...</p>
      </div>
    );
  }

  if (error || !dto) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-6">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200/70 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Transaction Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">{error || "This record may have been deleted."}</p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--navy-900)] text-white text-xs font-bold hover:bg-[var(--navy-800)] transition-colors"
          >
            <ArrowLeft size={16} /> Back to History
          </Link>
        </div>
      </div>
    );
  }

  const numericAmount = typeof dto.amount === "string" ? parseFloat(dto.amount) : dto.amount;
  const isIncome = dto.type === "income";
  const isExpense = dto.type === "expense";
  const isTransfer = dto.type === "transfer";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-36">
      {/* Header Bar */}
      <header className="bg-white/95 border-b border-slate-200/60 px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-slate-100/80 flex items-center justify-center text-slate-600 hover:bg-slate-200/80 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-black text-slate-900 tracking-tight">Transaction Details</span>
          <div className="w-9" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-5">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
          {/* Amount Summary Card */}
          <motion.div
            variants={item}
            className={cn(
              "relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg ring-1 ring-black/5 bg-gradient-to-br",
              getHeroGradient(dto.type),
            )}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-40 h-40 rounded-full bg-black/10 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/20 bg-white/10 backdrop-blur-sm">
                {getTypeIcon(dto.type)}
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 border border-white/20 backdrop-blur-sm">
                {dto.type}
              </span>
            </div>

            <div className="relative mt-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Amount</p>
              <h1 className="text-4xl font-black tracking-tight tabular-nums mt-1">
                {isIncome ? "+" : isExpense ? "-" : ""}
                {formatCurrency(numericAmount, userCurrency)}
              </h1>
              <p className="text-sm font-semibold text-white/90 mt-2">
                {dto.description || (isTransfer ? "Transfer Record" : "Untitled Entry")}
              </p>
              {!isTransfer && (
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-black/20 text-[11px] font-bold">
                  <Tag size={12} /> {dto.category?.name || "Uncategorized"}
                </span>
              )}
            </div>
          </motion.div>

          {/* Record Details Card */}
          <motion.div
            variants={item}
            className="rounded-3xl bg-white border border-slate-200/70 ring-1 ring-black/5 shadow-sm overflow-hidden"
          >
            <div className="px-5 pt-5 pb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Record Details
              </p>
            </div>
            <div className="px-5 py-1 pb-3 divide-y divide-slate-100">
              <DetailCell
                icon={<Wallet size={18} />}
                tile="bg-sky-50 text-sky-600"
                label={isTransfer ? "From" : "Account"}
                value={dto.account?.name || "Main Account"}
              />
              {isTransfer ? (
                <DetailCell
                  icon={<ArrowRight size={18} />}
                  tile="bg-indigo-50 text-indigo-600"
                  label="To"
                  value={dto.to_account?.name || "Transfer"}
                />
              ) : (
                <DetailCell
                  icon={<Tag size={18} />}
                  tile="bg-violet-50 text-violet-600"
                  label="Category"
                  value={dto.category?.name || "Uncategorized"}
                />
              )}
              <DetailCell
                icon={<Calendar size={18} />}
                tile="bg-amber-50 text-amber-600"
                label="Date"
                value={formatDateMedium(dto.transaction_date)}
              />
              <DetailCell
                icon={<Clock size={18} />}
                tile="bg-slate-100 text-slate-600"
                label="Time"
                value={formatTime(dto.transaction_date)}
              />
              <DetailCell
                icon={<Hash size={18} />}
                tile="bg-slate-100 text-slate-500"
                label="Record ID"
                value={`#${dto.id}`}
              />
              <DetailCell
                icon={<FileText size={18} />}
                tile="bg-teal-50 text-teal-600"
                label="Reference"
                value={dto.reference || "—"}
              />
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div variants={item} className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="py-3.5 px-4 rounded-2xl bg-[var(--navy-900)] text-white font-black text-xs shadow-lg shadow-[oklch(0.17_0.06_262_/_30%)] ring-1 ring-black/5 hover:bg-[var(--navy-800)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Pencil size={15} />
              Edit Record
            </button>

            <button
              type="button"
              onClick={() => setDeleting(true)}
              className="py-3.5 px-4 rounded-2xl bg-white border border-rose-200 text-rose-600 font-black text-xs shadow-sm ring-1 ring-black/5 hover:bg-rose-50/70 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Edit Modal */}
      {editing && (
        <TransactionDialog
          open={editing}
          onOpenChange={setEditing}
          transaction={dto}
          onSaved={() => {
            setEditing(false);
            void loadDetail();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-rose-600">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete this record? Your account balance will be updated immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-end">
            <AlertDialogCancel className="rounded-2xl text-xs font-bold border-slate-200 mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
