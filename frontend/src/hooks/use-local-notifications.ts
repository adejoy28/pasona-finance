// Local notification reminders.
//
// On native platforms this uses `@capacitor/local-notifications` to schedule
// real OS-level notifications (including repeating daily reminders). On the web
// it falls back to the `Notification` API, which only fires while the app is
// open.

import { useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export type ScheduleAlarmInput = {
  id: number;
  title: string;
  body?: string;
  at: Date;
  repeats?: boolean;
  sound?: string;
};

export type PermissionStatus = {
  display: "granted" | "denied" | "prompt" | "prompt-with-rationale";
};

export type UseLocalNotificationsResult = {
  isNative: boolean;
  isSupported: boolean;
  permission: PermissionStatus | null;
  requesting: boolean;
  requestPermission: () => Promise<PermissionStatus>;
  scheduleAlarm: (input: ScheduleAlarmInput) => Promise<{ id: string } | null>;
  cancelAlarm: (id: number) => Promise<void>;
  listScheduled: () => Promise<Array<{ id: number; title: string }>>;
};

// Android 8+ requires notifications to live on a channel. We create a dedicated
// channel for daily reminders on first use.
const REMINDER_CHANNEL_ID = "reminders";

function isNative() {
  return Capacitor.isNativePlatform();
}

function ensureReminderChannel(): Promise<void> {
  return LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: "Reminders",
    description: "Daily budget reminders",
    importance: 4,
    visibility: 1,
  }).catch(() => {});
}

function mapPermissionState(
  state: "prompt" | "prompt-with-rationale" | "granted" | "denied" | undefined,
): PermissionStatus["display"] {
  return state === "prompt-with-rationale" ? "prompt-with-rationale" : (state ?? "prompt");
}

export function useLocalNotifications(): UseLocalNotificationsResult {
  const isNativePlatform = isNative();
  const isSupported =
    isNativePlatform || (typeof window !== "undefined" && "Notification" in window);
  const [permission, setPermission] = useState<PermissionStatus | null>(null);
  const [requesting, setRequesting] = useState(false);

  const resolvePermission = useCallback(async (): Promise<PermissionStatus> => {
    if (isNativePlatform) {
      const result = await LocalNotifications.checkPermissions();
      return { display: mapPermissionState(result.display) };
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { display: "denied" };
    }
    const p = Notification.permission;
    return {
      display: p === "granted" ? "granted" : p === "denied" ? "denied" : "prompt",
    };
  }, [isNativePlatform]);

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    setRequesting(true);
    try {
      let status: PermissionStatus;
      if (isNativePlatform) {
        await ensureReminderChannel();
        const result = await LocalNotifications.requestPermissions();
        status = { display: mapPermissionState(result.display) };
      } else if (isSupported) {
        const result = await Notification.requestPermission();
        status = {
          display: result === "granted" ? "granted" : result === "denied" ? "denied" : "prompt",
        };
      } else {
        status = { display: "denied" };
      }
      setPermission(status);
      return status;
    } finally {
      setRequesting(false);
    }
  }, [isNativePlatform, isSupported]);

  const scheduleAlarm = useCallback(
    async ({ id, title, body, at, repeats }: ScheduleAlarmInput): Promise<{ id: string } | null> => {
      if (isNativePlatform) {
        await ensureReminderChannel();
        const result = await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body: body ?? "",
              channelId: REMINDER_CHANNEL_ID,
              schedule: {
                at,
                repeats: repeats ?? false,
                allowWhileIdle: true,
              },
            },
          ],
        });
        const scheduled = result.notifications[0];
        return scheduled ? { id: String(scheduled.id) } : { id: String(id) };
      }
      if (!isSupported || Notification.permission !== "granted") return null;
      new Notification(title, { body });
      return { id: String(Date.now()) };
    },
    [isNativePlatform, isSupported],
  );

  const cancelAlarm = useCallback(
    async (id: number): Promise<void> => {
      if (isNativePlatform) {
        try {
          await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch {
          // best effort
        }
        return;
      }
    },
    [isNativePlatform],
  );

  const listScheduled = useCallback(async (): Promise<Array<{ id: number; title: string }>> => {
    if (isNativePlatform) {
      try {
        const result = await LocalNotifications.getPending();
        return result.notifications.map((n) => ({ id: n.id, title: n.title }));
      } catch {
        return [];
      }
    }
    return [];
  }, [isNativePlatform]);

  return {
    isNative: isNativePlatform,
    isSupported,
    permission,
    requesting,
    requestPermission,
    scheduleAlarm,
    cancelAlarm,
    listScheduled,
  };
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function nextOccurrenceOfTime(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}
