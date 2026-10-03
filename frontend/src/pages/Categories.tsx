import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { notify } from "@/hooks/use-toast";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { CategoryDialog } from "@/components/finance/CategoryDialog";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { CategoriesSkeleton } from "@/components/finance/Skeletons";
import {
  ApiError,
  categories as categoriesApi,
  transactions as transactionsApi,
  type CategoryDto,
  type TransactionDto,
} from "@/lib/api";
import { formatCurrency, type Category } from "@/lib/finance";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { useOnline } from "@/hooks/use-online";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { useMe } from "@/hooks/use-me";
import { fadeSlideDown } from "@/lib/animations";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#ea580c", // orange
  "#059669", // emerald
  "#0284c7", // sky
  "#d97706", // amber
  "#dc2626", // red
  "#4f46e5", // indigo
  "#0d9488", // teal
];

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
  };
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const isOnline = useOnline();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { renderAmount } = usePrivacyMode();
  const meQuery = useMe();
  const currency = meQuery.data?.currency ?? DEFAULT_CURRENCY;

  useEffect(() => {
    document.title = "Categories — Pasona";
  }, []);

  const loadData = async () => {
    try {
      const [catsData, txsData] = await Promise.all([
        categoriesApi.listCategories(),
        transactionsApi.listTransactions({ per_page: 500 }).catch(() => ({ data: [] })),
      ]);
      setCategories(catsData.map(toCategory));
      setTransactions(txsData.data || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSaved = (category: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = category;
        return copy;
      }
      return [...prev, category];
    });
  };

  const handleDelete = (id: number) => {
    const target = categories.find((c) => c.id === id);
    if (target) setCategoryToDelete(target);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await categoriesApi.deleteCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      notify.success("Category deleted");
    } catch (err) {
      notify.error(
        err instanceof ApiError ? err.message : "Unable to delete category. Please try again.",
      );
    } finally {
      setCategoryToDelete(null);
    }
  };

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );

  // Calculate monthly spending/income per category
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const categorySpendMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const tx of transactions) {
      if (tx.date && !tx.date.startsWith(currentMonthPrefix)) continue;
      if (tx.category_id) {
        map.set(tx.category_id, (map.get(tx.category_id) || 0) + Number(tx.amount || 0));
      }
    }
    return map;
  }, [transactions, currentMonthPrefix]);

  const maxExpenseSpend = useMemo(() => {
    let mx = 0;
    for (const c of expenseCategories) {
      const s = categorySpendMap.get(c.id) || 0;
      if (s > mx) mx = s;
    }
    return mx > 0 ? mx : 1;
  }, [expenseCategories, categorySpendMap]);

  const maxIncomeSpend = useMemo(() => {
    let mx = 0;
    for (const c of incomeCategories) {
      const s = categorySpendMap.get(c.id) || 0;
      if (s > mx) mx = s;
    }
    return mx > 0 ? mx : 1;
  }, [incomeCategories, categorySpendMap]);

  if (loading && categories.length === 0) {
    return (
      <>
        <CategoriesSkeleton />
        <FinanceNavbar />
      </>
    );
  }

  const activeCategories = activeTab === "expense" ? expenseCategories : incomeCategories;
  const activeMax = activeTab === "expense" ? maxExpenseSpend : maxIncomeSpend;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Sticky Fixed Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0b1434] pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-6 shadow-sm border-b border-white/5 transition-all">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <Link
              to="/settings"
              className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shadow-sm relative overflow-hidden ring-2 ring-offset-2 ring-offset-[#0b1434] ${
                isOnline ? "ring-emerald-400 bg-white/10" : "ring-amber-400 bg-white/10"
              }`}
              aria-label="Profile settings"
              title={isOnline ? "Online" : "Offline"}
            >
              <User size={18} />
            </Link>
            <h1 className="text-base font-bold tracking-tight text-white">Categories</h1>
          </div>

          <NotificationBell />
        </div>
      </header>

      {/* Page Hero Card Section */}
      <motion.section
        variants={fadeSlideDown}
        initial="hidden"
        animate="visible"
        className="px-6 pt-2 pb-6 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Page Hero Card: Category Stats + Add Button on same row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2.5 shadow-inner"
          >
            <div className="flex justify-between items-center gap-2">
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider shrink-0">Labels</p>
              <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-white/70">
                <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">
                  {expenseCategories.length} Expenses
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  {incomeCategories.length} Income
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center gap-3">
              <h2 className="text-[22px] sm:text-2xl font-bold tracking-tight leading-none text-white truncate min-w-0">
                {categories.length} Total
              </h2>
              <button
                type="button"
                onClick={openCreate}
                className="px-3 py-1.5 bg-white text-[#101b45] hover:bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                <Plus size={13} strokeWidth={2.5} className="shrink-0" />
                <span>New Category</span>
              </button>
            </div>
            <p className="text-[11px] text-white/60">
              Bar length is relative to your highest spending category this month.
            </p>
          </motion.div>
        </div>
      </motion.section>

      <main className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1 border border-slate-200/40">
            <button
              type="button"
              onClick={() => setActiveTab("expense")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-black transition-all text-center select-none flex items-center justify-center gap-2 cursor-pointer",
                activeTab === "expense"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              <ArrowDownCircle size={14} className={activeTab === "expense" ? "text-rose-500" : ""} />
              Expenses ({expenseCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("income")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-black transition-all text-center select-none flex items-center justify-center gap-2 cursor-pointer",
                activeTab === "income"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              <ArrowUpCircle size={14} className={activeTab === "income" ? "text-emerald-500" : ""} />
              Income ({incomeCategories.length})
            </button>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-slate-100 overflow-hidden divide-y divide-slate-100">
            {activeCategories.map((c, i) => {
              const spend = categorySpendMap.get(c.id) || 0;
              const barPct = Math.round((spend / activeMax) * 100);
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

              return (
                <div key={c.id} className="p-4 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={`/transactions?category_id=${c.id}`}
                      className="flex-1 min-w-0 space-y-1.5 block cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-900 tabular-nums shrink-0">
                          {spend > 0 ? (
                            renderAmount(formatCurrency(spend, currency))
                          ) : (
                            <span className="text-slate-400 font-normal">No activity</span>
                          )}
                        </span>
                      </div>

                      {/* Horizontal activity bar */}
                      <div
                        className="h-1.5 w-full rounded-full overflow-hidden"
                        style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, #f1f5f9)` }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(spend > 0 ? 5 : 0, barPct))}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>

                      {/* Subtitle / Limit / Status */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        {/* TODO: wire up category limits when backend exposes them */}
                        <span className="text-slate-400 font-medium">No limit set</span>
                        {spend > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {barPct}% of top
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openEdit(c);
                        }}
                        className="p-2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          void handleDelete(c.id);
                        }}
                        className="p-2 text-[var(--muted)] hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && activeCategories.length === 0 && (
              <p className="p-6 text-xs text-slate-400 text-center font-medium">
                No {activeTab} categories yet
              </p>
            )}
          </div>
        </div>
      </main>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSaved={handleSaved}
      />
      <ConfirmDestructiveDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(op) => {
          if (!op) setCategoryToDelete(null);
        }}
        title="Delete category?"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        confirmLabel="Delete Category"
        onConfirm={confirmDelete}
      />
      <FinanceNavbar />
    </div>
  );
}

