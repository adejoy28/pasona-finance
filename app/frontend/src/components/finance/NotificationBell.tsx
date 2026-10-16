import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationPanel } from "./NotificationPanel";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * Shared notification bell button used in the top header bar of pages.
 *
 * Renders the bell icon with an unread badge dot, and opens the
 * NotificationPanel side display on click.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifs = useNotifications();

  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer active:scale-95"
      >
        <Bell size={18} />
        {notifs.unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-[#101b45]" />
        )}
      </button>

      <NotificationPanel
        open={open}
        onOpenChange={setOpen}
        notifications={notifs.notifications}
        unreadCount={notifs.unreadCount}
        loading={notifs.loading}
        hasMore={notifs.hasMore}
        loadMore={notifs.loadMore}
        markRead={notifs.markRead}
        markAllRead={notifs.markAllRead}
        removeNotification={notifs.removeNotification}
        clearAll={notifs.clearAll}
        refresh={notifs.refresh}
      />
    </>
  );
}
