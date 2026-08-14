import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { FinanceNavbar } from "@/components/finance/Navbar";
import { CategoryDialog } from "@/components/finance/CategoryDialog";
import { ApiError, categories as categoriesApi, type CategoryDto } from "@/lib/api";
import type { Category } from "@/lib/finance";

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
  };
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-30 card-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Categories</h1>
              <p className="text-xs text-slate-400 font-medium">Manage income and expense labels</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center card-shadow hover:bg-blue-700 transition-colors"
            aria-label="New category"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
            <ArrowDownCircle size={14} className="text-red-500" /> Expenses ({expenseCategories.length})
          </h2>
          <div className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
            {expenseCategories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Tag size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
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
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
            <ArrowUpCircle size={14} className="text-green-500" /> Income ({incomeCategories.length})
          </h2>
          <div className="bg-white rounded-2xl card-shadow border border-slate-50 overflow-hidden divide-y divide-slate-50">
            {incomeCategories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <Tag size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(c.id)}
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
          </div>
        </section>
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
