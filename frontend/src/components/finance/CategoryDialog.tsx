import { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ApiError, categories as categoriesApi, type CategoryDto } from "@/lib/api";
import type { Category } from "@/lib/finance";

type CategoryTypeFilter = "income" | "expense";

const TYPE_OPTIONS: { id: CategoryTypeFilter; label: string; icon: React.ReactNode }[] = [
  { id: "expense", label: "Expense", icon: <ArrowDownCircle size={16} /> },
  { id: "income", label: "Income", icon: <ArrowUpCircle size={16} /> },
];

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog runs in edit mode for that category. */
  category?: Category | null;
  onSaved: (category: Category) => void;
  defaultType?: CategoryTypeFilter;
};

function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
  };
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
  defaultType = "expense",
}: CategoryDialogProps) {
  const popup = usePopup();
  const isEditMode = Boolean(category);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryTypeFilter>(defaultType);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (category) {
      setName(category.name);
      setType(category.type === "income" ? "income" : "expense");
    } else {
      setName("");
      setType(defaultType);
    }
    setError(null);
  }, [open, category, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Please enter a category name.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const saved = category
        ? await categoriesApi.updateCategory(category.id, { name: trimmed, type })
        : await categoriesApi.createCategory({ name: trimmed, type });
      popup.success(isEditMode ? "Category updated" : "Category created");
      onSaved(toCategory(saved));
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isEditMode
            ? "Unable to update the category. Please try again."
            : "Unable to create the category. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isEditMode ? "Edit category" : "New category";
  const description = isEditMode
    ? "Update the name or type for this category."
    : "Add a category so transactions are organized automatically.";
  const submitLabel = isEditMode ? "Save Changes" : "Create Category";
  const pendingLabel = isEditMode ? "Saving…" : "Creating…";

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
              Name
            </label>
            <input
              type="text"
              placeholder="e.g. Groceries"
              autoFocus
              maxLength={40}
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
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  disabled={isSubmitting}
                  className={cn(
                    "p-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5",
                    type === opt.id
                      ? opt.id === "income"
                        ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-100"
                        : "bg-red-500 text-white border-red-500 shadow-lg shadow-red-100"
                      : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100",
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
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
