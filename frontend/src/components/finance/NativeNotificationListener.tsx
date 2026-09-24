import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { usePopup } from "@/components/ui/popup";
import {
  NOTIFICATION_ID_MORNING_FACT,
  NOTIFICATION_ID_MIDDAY_CAPABILITY,
  NOTIFICATION_ID_EVENING_REMINDER,
  scheduleAllAppNotifications,
} from "@/hooks/use-local-notifications";
import type { FinancialWisdomItem, AppCapabilityItem } from "@/lib/notifications-catalog";

/**
 * Global listener on native platforms that intercepts local notification taps
 * and appropriately directs the user:
 * - Evening Reminder: Navigates to /transactions/add with friendly reminder prompt (Carries CTA)
 * - Afternoon Capability: Navigates to the featured page (e.g. /categories, /accounts) with feature spotlight
 * - Morning Wisdom: Presents the financial fact or quote reflection in the standard dismissible popup
 */
export function NativeNotificationListener() {
  const popup = usePopup();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;

    // Auto-refresh scheduled alarms with current day's rotating content
    const enabled =
      typeof localStorage !== "undefined" &&
      localStorage.getItem("pasona.reminder.enabled") === "1";
    if (enabled) {
      const reminderTime = localStorage.getItem("pasona.reminder.time") ?? "21:00";
      const factTime = localStorage.getItem("pasona.notification.fact_time") ?? "09:00";
      const capabilityTime = localStorage.getItem("pasona.notification.capability_time") ?? "14:00";
      void scheduleAllAppNotifications({
        reminderTime,
        factTime,
        capabilityTime,
      });
    }

    const setupListener = async () => {
      try {
        const listener = await LocalNotifications.addListener(
          "localNotificationActionPerformed",
          (action) => {
            if (!isMounted) return;
            const notif = action.notification;
            const extra = notif.extra as Record<string, unknown> | undefined;
            const notifId = notif.id;
            const notifType = (extra?.type as string | undefined) ?? "";

            // 1. Transaction Reminder (Carries explicit CTA)
            if (notifId === NOTIFICATION_ID_EVENING_REMINDER || notifType === "reminder") {
              const route = (extra?.route as string | undefined) || "/transactions/add";
              void navigate(route);
              popup.info("Daily Check-in ⏰", {
                description: "Ready to log today's expenses? Keeping your transactions updated protects your streak!",
                duration: 6000,
              });
              return;
            }

            // 2. App Capabilities & Progress Spotlight
            if (notifId === NOTIFICATION_ID_MIDDAY_CAPABILITY || notifType === "capability") {
              const route = extra?.route as string | undefined;
              const item = extra?.item as AppCapabilityItem | undefined;
              if (route) {
                void navigate(route);
              }
              popup.info(notif.title || item?.title || "App Spotlight", {
                description:
                  notif.largeBody ||
                  notif.body ||
                  item?.description ||
                  "Explore this feature in Pasona Finance.",
                duration: 10000,
              });
              return;
            }

            // 3. Morning Financial Wisdom (Facts / Quotes - Informative)
            const wisdomItem = extra?.item as FinancialWisdomItem | undefined;
            const title = notif.title || wisdomItem?.title || "Daily Wisdom";
            const description =
              notif.largeBody ||
              notif.body ||
              (wisdomItem
                ? `${wisdomItem.content}\n\n💡 Reflection: ${wisdomItem.takeaway}`
                : "Daily financial insight from Pasona.");

            popup.fact(title, {
              description,
              duration: 15000,
            });
          }
        );

        return () => {
          listener.remove();
        };
      } catch {
        // Silently skip if plugin listener fails
      }
    };

    const cleanupPromise = setupListener();

    return () => {
      isMounted = false;
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [popup, navigate]);

  return null;
}
