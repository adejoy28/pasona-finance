import { Link } from "react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  MoreVertical,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { usePopup } from "@/components/ui/popup";
import { AccountCardSkeleton, AccountsSkeleton } from "@/components/finance/Skeletons";
import { AccountDialog } from "@/components/finance/AccountDialog";
import { NotificationBell } from "@/components/finance/NotificationBell";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency, type Account } from "@/lib/finance";
import { usePrivacyMode } from "@/hooks/use-privacy-mode";
import { ApiError, accounts as accountsApi, type AccountDto } from "@/lib/api";
import { useMe } from "@/hooks/use-me";
import { useOnline } from "@/hooks/use-online";
import {
  fadeSlideDown,
  fadeSlideUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";

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
  const { renderAmount } = usePrivacyMode();
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const userQuery = useMe();
  const userCurrency = userQuery.data?.currency ?? DEFAULT_CURRENCY;
  const isOnline = useOnline();
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

  if (loading && accounts.length === 0) {
    return <AccountsSkeleton />;
  }

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
            <h1 className="text-base font-bold tracking-tight text-white">My Accounts</h1>
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
          {/* Page Hero Card: Total Net Worth + Add Button on same row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 space-y-2.5 shadow-inner"
          >
            <div className="flex justify-between items-center gap-2">
              <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider shrink-0">
                Total Net Worth
              </p>
              <span className="text-[10.5px] text-white/70 font-medium">
                {accounts.length} funding sources
              </span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <h2 className="text-[22px] sm:text-2xl font-bold tracking-tight leading-none text-white truncate min-w-0">
                {renderAmount(totalBalance, userCurrency)}
              </h2>
              <button
                type="button"
                onClick={openCreate}
                className="px-3 py-1.5 bg-white text-[#101b45] hover:bg-slate-100 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                <Plus size={13} strokeWidth={2.5} className="shrink-0" />
                <span>New Account</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <main className="p-6 space-y-4 max-w-5xl mx-auto w-full">
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
                    {renderAmount(account.balance, userCurrency)}
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
