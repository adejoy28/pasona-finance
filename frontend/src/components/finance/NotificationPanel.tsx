import { useEffect } from "react";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Download,
  Loader2,
  Mail,
  Megaphone,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { NotificationDto } from "@/lib/api/notifications";

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
  refresh: () => Promise<void>;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  welcome: <PartyPopper size={16} className="text-amber-500" />,
  reminder: <Bell size={16} className="text-blue-500" />,
  account_created: <CreditCard size={16} className="text-emerald-500" />,
  import_complete: <Download size={16} className="text-violet-500" />,
  announcement: <Megaphone size={16} className="text-rose-500" />,
  streak_report: <Sparkles size={16} className="text-amber-500" />,
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function dateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return "Earlier";
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
  refresh,
}: NotificationPanelProps) {
  // Fetch first page when panel opens
  useEffect(() => {
    if (open && notifications.length === 0) {
      void refresh();
    }
  }, [open, notifications.length, refresh]);

  // Group notifications by date
  const groups: { label: string; items: NotificationDto[] }[] = [];
  for (const n of notifications) {
    const label = dateGroup(n.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(n);
    } else {
      groups.push({ label, items: [n] });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[400px] p-0 flex flex-col bg-slate-50 border-l border-slate-200"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 bg-white border-b border-slate-100 space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-extrabold text-slate-900">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>
          <SheetDescription className="text-xs text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </SheetDescription>
        </SheetHeader>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {notifications.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Mail size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-600 mb-1">
                No notifications yet
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                When you get reminders, add accounts, or import transactions, they'll show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="px-5 pt-4 pb-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {group.label}
                    </p>
                  </div>
                  {group.items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.read_at) void markRead(n.id);
                      }}
                      className={
                        "w-full text-left px-5 py-3.5 flex gap-3 items-start transition-colors hover:bg-white cursor-pointer " +
                        (!n.read_at
                          ? "bg-blue-50/60 border-l-[3px] border-l-blue-400"
                          : "border-l-[3px] border-l-transparent")
                      }
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {TYPE_ICON[n.type] ?? (
                          <Bell size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={
                              "text-xs truncate " +
                              (!n.read_at
                                ? "font-bold text-slate-800"
                                : "font-semibold text-slate-600")
                            }
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                            {relativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {n.body}
                        </p>
                      </div>
                      {!n.read_at && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="px-5 py-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loading}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading spinner for first load */}
          {loading && notifications.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
