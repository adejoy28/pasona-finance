import { Link } from "react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, MoreVertical, Pencil, Plus, Smartphone, Trash2, Wallet } from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { AccountCardSkeleton } from "@/components/finance/Skeletons";
import { AccountDialog } from "@/components/finance/AccountDialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency, type Account } from "@/lib/finance";
import { ApiError, accounts as accountsApi, type AccountDto } from "@/lib/api";
import { useMe } from "@/hooks/use-me";
import { fadeSlideUp, staggerContainer, staggerItem } from "@/lib/animations";

const CASH_AT_HAND_STORAGE_KEY = "pasona.cashAtHand.seeded";

function getIcon(type: Account["type"]) {
  if (type === "bank") return <CreditCard className="text-blue-600" />;
  if (type === "mobile") return <Smartphone className="text-purple-600" />;
  return <Wallet className="text-amber-600" />;
}

function normalizeAccount(dto: AccountDto): Account {
  const balanceValue = dto.balance ?? dto.starting_balance ?? 0;
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    balance: typeof balanceValue === "string" ? parseFloat(balanceValue) : Number(balanceValue),
  };
}

function readCashAtHandSeeded(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(CASH_AT_HAND_STORAGE_KEY) === "1";
}

function markCashAtHandSeeded(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CASH_AT_HAND_STORAGE_KEY, "1");
  } catch {
    // localStorage may be unavailable — best effort.
  }
}

export function AccountsIndex() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const popup = usePopup();

  useEffect(() => {
    document.title = "Accounts — Pasona";
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountsApi.listAccounts();
      setAccounts(data.map(normalizeAccount));
      if (data.length > 0) {
        markCashAtHandSeeded();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (accounts.length > 0) return;
    if (readCashAtHandSeeded()) return;
    (async () => {
      try {
        const created = await accountsApi.createAccount({
          name: "Cash at Hand",
          type: "cash",
          currency: userCurrency,
          starting_balance: 0,
        });
        setAccounts([normalizeAccount(created)]);
        markCashAtHandSeeded();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        }
      }
    })();
  }, [loading, accounts.length, userCurrency]);

  const openCreate = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleSaved = (account: Account) => {
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === account.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = account;
        return copy;
      }
      return [...prev, account];
    });
    markCashAtHandSeeded();
  };

  const handleDelete = async (id: number) => {
    const accountToDelete = accounts.find((a) => a.id === id);
    if (!accountToDelete) return;
    if (
      !confirm(
        `Are you sure you want to delete "${accountToDelete.name}"? Transactions on this account will not be removed, but the account will no longer appear.`,
      )
    ) {
      return;
    }

    try {
      await accountsApi.deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      popup.success("Account deleted");
    } catch (err) {
      popup.error(
        err instanceof ApiError
          ? err.message
          : "Unable to delete the account. Please try again.",
      );
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white border-b border-slate-100 px-6 pt-10 pb-6 sticky top-0 z-30 card-shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">My Accounts</h1>
            <p className="text-xs text-slate-400 font-medium">Manage your funding sources</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center card-shadow hover:bg-blue-700 transition-colors"
            aria-label="New account"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg shadow-slate-200">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Net Worth</p>
            <p className="text-2xl font-black">{formatCurrency(totalBalance, userCurrency)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <CreditCard size={20} />
          </div>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {loading && accounts.length === 0 && (
            <>
              <AccountCardSkeleton />
              <AccountCardSkeleton />
              <AccountCardSkeleton />
            </>
          )}
          <AnimatePresence mode="popLayout">
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              layout
              variants={staggerItem}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="relative bg-white p-6 rounded-2xl card-shadow border border-slate-50 overflow-hidden group"
            >
              <Link
                to={`/accounts/${account.id}`}
                className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                aria-label={`View ${account.name}`}
              />
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start pointer-events-none">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl shrink-0",
                      account.type === "bank"
                        ? "bg-blue-50"
                        : account.type === "mobile"
                          ? "bg-purple-50"
                          : "bg-amber-50",
                    )}
                  >
                    {getIcon(account.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 leading-tight truncate" title={account.name}>
                      {account.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {account.type}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="w-9 h-9 -mt-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors pointer-events-auto relative z-20"
                      aria-label={`Actions for ${account.name}`}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={() => openEdit(account)}>
                      <Pencil size={15} className="mr-2" />
                      Edit account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void handleDelete(account.id)}
                      className="text-rose-600 focus:text-rose-600"
                    >
                      <Trash2 size={15} className="mr-2" />
                      Delete account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="relative z-10 mt-6 pt-6 border-t border-slate-50 flex justify-between items-end pointer-events-none">
                <div className="overflow-hidden">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Available Balance
                  </p>
                  <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate">
                    {formatCurrency(account.balance, userCurrency)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>

          {!loading && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              type="button"
              onClick={openCreate}
              className="w-full p-5 rounded-2xl bg-white border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors text-left flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0">
                <Plus size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  Add another account
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Bank, mobile money, or cash wallet</p>
              </div>
            </motion.button>
          )}
        </motion.div>
      </main>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
        onSaved={handleSaved}
      />
    </div>
  );
}
