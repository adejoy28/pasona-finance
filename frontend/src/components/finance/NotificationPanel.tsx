import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Trash2,
  Bell,
  Wallet,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  Loader2,
  CheckCheck,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { notify } from "@/hooks/use-toast";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";
import { getDailyMoneyFact } from "@/lib/facts";
import type { NotificationDto } from "@/lib/api/notifications";
import { accounts as accountsApi, transactions as transactionsApi } from "@/lib/api";

type ActionItem = {
  id: string;
  title: string;
  body: string;
  badge?: string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
};

type NotificationPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationDto[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  removeNotification: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
};

function formatNotificationDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Today | ${timeStr}`;
  }

  if (diffDays === 1) {
    return `1 day ago | ${timeStr}`;
  }

  if (diffDays > 1 && diffDays < 7) {
    return `${diffDays} days ago | ${timeStr}`;
  }

  const day = d.getDate();
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month}. ${year} | ${timeStr}`;
}

function getNotificationVisual(type: string, title: string) {
  const lowerType = (type || "").toLowerCase();
  const lowerTitle = (title || "").toLowerCase();

  if (
    lowerType.includes("security") ||
    lowerTitle.includes("security") ||
    lowerTitle.includes("2fa") ||
    lowerTitle.includes("authentication")
  ) {
    return {
      bg: "bg-blue-50",
      textColor: "text-blue-500",
      icon: <ShieldCheck size={22} className="text-blue-500" />,
    };
  }

  if (
    lowerType.includes("card_feature") ||
    lowerTitle.includes("card feature") ||
    lowerTitle.includes("multiple card") ||
    lowerTitle.includes("mastercard")
  ) {
    return {
      bg: "bg-amber-50",
      textColor: "text-amber-500",
      icon: <Sparkles size={20} className="text-amber-500" />,
    };
  }

  if (
    lowerType.includes("update") ||
    lowerType.includes("announcement") ||
    lowerTitle.includes("update")
  ) {
    return {
      bg: "bg-rose-50",
      textColor: "text-rose-500",
      icon: <Info size={20} className="text-rose-500" />,
    };
  }

  if (
    lowerType.includes("account_created") ||
    lowerType.includes("credit_card") ||
    lowerTitle.includes("card connected") ||
    lowerTitle.includes("card linked")
  ) {
    return {
      bg: "bg-purple-50",
      textColor: "text-purple-500",
      icon: <Wallet size={20} className="text-purple-500" />,
    };
  }

  if (
    lowerType.includes("welcome") ||
    lowerType.includes("setup") ||
    lowerTitle.includes("account setup") ||
    lowerTitle.includes("successful")
  ) {
    return {
      bg: "bg-emerald-50",
      textColor: "text-emerald-500",
      icon: <UserCheck size={20} className="text-emerald-500" />,
    };
  }

  return {
    bg: "bg-blue-50",
    textColor: "text-blue-500",
    icon: <Bell size={20} className="text-blue-500" />,
  };
}

export function NotificationPanel({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  loading,
  hasMore,
  loadMore,
  markRead,
  markAllRead,
  removeNotification,
  clearAll,
  refresh,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationDto | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  const loadActionItems = useCallback(async () => {
    try {
      const items: ActionItem[] = [];
      const accountsList = await accountsApi.listAccounts().catch(() => []);

      // 1. Account balance check state
      for (const acc of accountsList) {
        const stored = localStorage.getItem(`pasona.acct_chk:${acc.id}`);
        if (!stored) {
          items.push({
            id: `acct-check-${acc.id}`,
            title: `Check your ${acc.name} balance`,
            body: "Compare with your bank app to ensure no missing transactions.",
            badge: "Check",
            icon: <Wallet size={18} className="text-blue-600" />,
            iconBg: "bg-blue-50",
            href: `/accounts/${acc.id}`,
          });
        } else {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed.diff === "number" && Math.abs(parsed.diff) > 0.01) {
              items.push({
                id: `acct-diff-${acc.id}`,
                title: `${acc.name} off by ₦${Math.abs(parsed.diff).toLocaleString()}`,
                body: "Pasona balance differs from your last bank check. Tap to reconcile.",
                badge: "Reconcile",
                icon: <AlertTriangle size={18} className="text-amber-600" />,
                iconBg: "bg-amber-50",
                href: `/accounts/${acc.id}`,
              });
            }
          } catch {
            // ignore JSON parse error
          }
        }
      }

      // 2. Duplicates check
      const txRes = await transactionsApi
        .listTransactions({ per_page: 100 })
        .catch(() => ({ data: [] }));
      const txs = txRes.data || [];
      const seen = new Set<string>();
      let dupCount = 0;
      for (const t of txs) {
        const key = `${t.amount}_${t.date}_${t.account_id ?? ""}`;
        if (seen.has(key)) {
          dupCount++;
        } else {
          seen.add(key);
        }
      }
      if (dupCount > 0) {
        items.push({
          id: "tx-duplicates",
          title: `${dupCount} duplicate ${dupCount === 1 ? "entry" : "entries"} to review`,
          body: "Possible duplicate transactions detected across your accounts.",
          badge: "Review",
          icon: <ShieldAlert size={18} className="text-purple-600" />,
          iconBg: "bg-purple-50",
          href: "/transactions?flag=duplicates",
        });
      }

      setActionItems(items);
    } catch {
      setActionItems([]);
    }
  }, []);

  // Fetch when panel opens if empty
  useEffect(() => {
    if (open) {
      if (notifications.length === 0) {
        void refresh();
      }
      void loadActionItems();
    }
  }, [open, notifications.length, refresh, loadActionItems]);

  // Reset selected notification when closing panel
  useEffect(() => {
    if (!open) {
      setSelectedNotif(null);
    }
  }, [open]);

  const handleOpenDetail = (notif: NotificationDto) => {
    setSelectedNotif(notif);
    if (!notif.read_at) {
      void markRead(notif.id);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    void removeNotification(id);
    if (selectedNotif?.id === id) {
      setSelectedNotif(null);
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate("/settings#notifications");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] p-0 flex flex-col bg-white border-l border-slate-200 outline-none [&>button.absolute]:hidden"
      >
        {selectedNotif ? (
          /* ========================================================= */
          /* 1. DETAIL VIEW WITHIN THE POPUP                           */
          /* ========================================================= */
          <>
            {/* Header with Back Arrow to List */}
            <SheetHeader className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5 bg-white/95 backdrop-blur-md border-b border-slate-100 flex-row items-center justify-between space-y-0 text-left">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  aria-label="Back to notification list"
                  className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <SheetTitle className="text-base font-bold text-slate-900 tracking-tight">
                  Notification
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Notification content details
                </SheetDescription>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, selectedNotif.id)}
                  title="Remove this notification"
                  aria-label="Remove this notification"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </SheetHeader>

            {/* Content view inside popup */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    getNotificationVisual(selectedNotif.type, selectedNotif.title).bg
                  }`}
                >
                  {getNotificationVisual(selectedNotif.type, selectedNotif.title).icon}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedNotif.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {formatNotificationDate(selectedNotif.created_at)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shadow-xs">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap select-text">
                  {selectedNotif.body}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, selectedNotif.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>

                  {(selectedNotif.type === "reminder" ||
                    selectedNotif.title.toLowerCase().includes("fact") ||
                    selectedNotif.body.toLowerCase().includes("fact")) && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        const dailyFact = getDailyMoneyFact();
                        const title = selectedNotif.title.includes("Fact")
                          ? selectedNotif.title
                          : `💡 ${dailyFact.title}`;
                        const desc = `${selectedNotif.body}\n\n💡 Takeaway: ${dailyFact.take}`;
                        notify.fact(title, { description: desc, duration: 15000 });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <Lightbulb size={14} className="text-amber-600" />
                      View in popup
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotif(null)}
                  className="px-5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Back to list
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* 2. NOTIFICATIONS LIST / EMPTY VIEW WITHIN THE POPUP        */
          /* ========================================================= */
          <>
            {/* Header matching mockup */}
            <SheetHeader className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3.5 bg-white/95 backdrop-blur-md border-b border-slate-100 flex-row items-center justify-between space-y-0 text-left">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Close notifications"
                  className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <SheetTitle className="text-lg font-bold text-slate-900 tracking-tight">
                  Notification
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Your notifications list
                </SheetDescription>
              </div>

              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="Clear all notifications"
                    aria-label="Clear all notifications"
                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleGoToSettings}
                  aria-label="Notification Settings"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                >
                  <SettingsIcon size={20} />
                </button>
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col">
              {loading && notifications.length === 0 && actionItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-24">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <p className="text-xs text-slate-400 mt-3 font-medium">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 && actionItems.length === 0 ? (
                /* Empty State matching mockup */
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center select-none">
                  <div className="relative w-56 h-56 flex items-center justify-center mb-6">
                    {/* Back tilted clipboard */}
                    <div
                      className="absolute w-36 h-48 bg-white border border-slate-200/90 rounded-2xl shadow-sm -rotate-12 -translate-x-4 -translate-y-2 p-3 flex flex-col"
                      style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.04))" }}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-blue-500 rounded-md shadow-xs flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-white/80" />
                      </div>
                      <div className="w-full flex-1 bg-slate-100/80 rounded-xl mt-2" />
                    </div>

                    {/* Front clipboard */}
                    <div
                      className="relative z-10 w-36 h-48 bg-white border border-slate-200/90 rounded-2xl shadow-lg translate-x-3 translate-y-2 p-3 flex flex-col"
                      style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.06))" }}
                    >
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-blue-600 rounded-md shadow-sm flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-white" />
                      </div>
                      <div className="w-full flex-1 bg-slate-100 rounded-xl mt-2" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                    Empty
                  </h2>
                  <p className="text-sm text-slate-400 max-w-[260px] leading-relaxed">
                    You don't have any notifications at this time
                  </p>
                </div>
              ) : (
                /* Notification & Actions Content */
                <div className="flex flex-col">
                  {/* Actionable Client Items (Above Server Notifications) */}
                  {actionItems.length > 0 && (
                    <div className="border-b border-slate-100 bg-slate-50/50">
                      <div className="px-5 py-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Suggested Actions
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          {actionItems.length}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {actionItems.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => {
                              onOpenChange(false);
                              navigate(action.href);
                            }}
                            className="w-full text-left px-5 py-3.5 flex items-start gap-3.5 hover:bg-white transition-colors cursor-pointer group"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${action.iconBg}`}
                            >
                              {action.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                  {action.title}
                                </h4>
                                {action.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 shrink-0">
                                    {action.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                {action.body}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Server Notification List */}
                  {notifications.length > 0 && (
                    <div className="py-1 divide-y divide-slate-100">
                      {unreadCount > 0 && (
                        <div className="px-5 py-2.5 flex items-center justify-between bg-slate-50/70 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">
                            {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
                          </span>
                          <button
                            type="button"
                            onClick={() => void markAllRead()}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            <CheckCheck size={14} />
                            Mark all as read
                          </button>
                        </div>
                      )}

                  {notifications.map((item) => {
                    const visual = getNotificationVisual(item.type, item.title);
                    const isUnread = !item.read_at;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenDetail(item)}
                        className="group relative px-5 py-4 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        {/* Category Circle Icon */}
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${visual.bg}`}
                        >
                          {visual.icon}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                              {isUnread && (
                                <span className="bg-[var(--primary)] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full tracking-wide">
                                  New
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDelete(e, item.id)}
                                title="Remove notification"
                                aria-label="Remove notification"
                                className="text-[var(--muted)] hover:text-rose-500 p-1 -m-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                            {formatNotificationDate(item.created_at)}
                          </p>

                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Load more button */}
                  {hasMore && (
                    <div className="p-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => void loadMore()}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-bold text-[var(--primary)] hover:opacity-85 transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Loading more...
                          </span>
                        ) : (
                          "Load older notifications"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>

      <ConfirmDestructiveDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Remove all notifications?"
        description="Are you sure you want to remove all notifications? This action cannot be undone."
        confirmLabel="Remove All"
        onConfirm={async () => {
          await clearAll();
          setSelectedNotif(null);
          notify.success("Notifications cleared");
        }}
      />
    </Sheet>
  );
}
export default NotificationPanel;
