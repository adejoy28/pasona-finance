import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Plus,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { CategoryDialog } from "@/components/finance/CategoryDialog";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { CategoriesSkeleton } from "@/components/finance/Skeletons";
import { ApiError, categories as categoriesApi, type CategoryDto } from "@/lib/api";
import type { Category } from "@/lib/finance";
import { useOnline } from "@/hooks/use-online";
import { fadeSlideDown } from "@/lib/animations";
import { cn } from "@/lib/utils";

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
  };
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const isOnline = useOnline();
  const popup = usePopup();

  useEffect(() => {
    document.title = "Categories — Pasona";
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.listCategories();
      setCategories(data.map(toCategory));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
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

  const handleDelete = async (id: number) => {
    const categoryToDelete = categories.find((c) => c.id === id);
    if (!categoryToDelete) return;
    if (!confirm(`Are you sure you want to delete "${categoryToDelete.name}"?`)) return;

    try {
      await categoriesApi.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      popup.success("Category deleted");
    } catch (err) {
      popup.error(
        err instanceof ApiError ? err.message : "Unable to delete category. Please try again.",
      );
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

  if (loading && categories.length === 0) {
    return (
      <>
        <CategoriesSkeleton />
        <FinanceNavbar />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Top Header & Page Hero Card Section */}
      <motion.header
        variants={fadeSlideDown}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 pb-10 bg-gradient-to-b from-[#0b1434] via-[#101b45] to-[#162356] text-white border-b border-white/10 shadow-xl shadow-navy-950/20"
      >
        <div className="max-w-5xl mx-auto">
          {/* Top Header Bar: Back/Avatar with Online Dot (left), Title (center), Notifications (right) */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-sm block relative overflow-hidden"
                aria-label="Profile settings"
              >
                <User size={20} />
              </Link>
            </div>

            <h1 className="text-lg font-extrabold tracking-tight">Categories</h1>

            <NotificationBell />
          </div>

          {/* Page Hero Card: Category Stats + Add Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3 shadow-inner"
          >
            <div className="flex justify-between items-center gap-2">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider shrink-0">Labels</p>
              <button
                type="button"
                onClick={openCreate}
                className="px-3 py-1.5 bg-white text-[#101b45] hover:bg-slate-100 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                <Plus size={14} strokeWidth={2.5} className="shrink-0" />
                <span>New Category</span>
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white truncate">
                {categories.length} Total
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-white/70 pt-1">
                <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full">
                  {expenseCategories.length} Expenses
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  {incomeCategories.length} Income
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

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
                "flex-1 py-2 rounded-lg text-xs font-black transition-all text-center select-none flex items-center justify-center gap-2",
                activeTab === "expense"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ArrowDownCircle size={14} className={activeTab === "expense" ? "text-red-500" : ""} />
              Expenses ({expenseCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("income")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-black transition-all text-center select-none flex items-center justify-center gap-2",
                activeTab === "income"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ArrowUpCircle size={14} className={activeTab === "income" ? "text-green-500" : ""} />
              Income ({incomeCategories.length})
            </button>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
            {activeTab === "expense" ? (
              <>
                {expenseCategories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                    <Link to={`/transactions?category_id=${c.id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Tag size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{c.name}</span>
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); openEdit(c); }}
                        className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); void handleDelete(c.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && expenseCategories.length === 0 && (
                  <p className="p-4 text-xs text-slate-400 text-center font-medium">No expense categories yet</p>
                )}
              </>
            ) : (
              <>
                {incomeCategories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                    <Link to={`/transactions?category_id=${c.id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Tag size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{c.name}</span>
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); openEdit(c); }}
                        className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); void handleDelete(c.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && incomeCategories.length === 0 && (
                  <p className="p-4 text-xs text-slate-400 text-center font-medium">No income categories yet</p>
                )}
              </>
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
      <FinanceNavbar />
    </div>
  );
}
