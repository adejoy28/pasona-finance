// Local notification reminders.
//
// On native platforms this uses `@capacitor/local-notifications` to schedule
// real OS-level notifications (including repeating daily reminders). On the web
// it falls back to the `Notification` API, which only fires while the app is
// open.

import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  getDailyWisdom,
  getDailyCapability,
  getDailyReminder,
} from "@/lib/notifications-catalog";

export const NOTIFICATION_ID_MORNING_FACT = 1001;
export const NOTIFICATION_ID_MIDDAY_CAPABILITY = 1002;
export const NOTIFICATION_ID_EVENING_REMINDER = 1003;

// Rolling 7-day IDs for each channel:
// Evening: 1003..1009
// Morning: 1020..1026
// Afternoon: 1040..1046
export const ALL_APP_NOTIFICATION_IDS: number[] = [
  1001, 1002, 1003,
  ...Array.from({ length: 7 }, (_, i) => 1003 + i),
  ...Array.from({ length: 7 }, (_, i) => 1020 + i),
  ...Array.from({ length: 7 }, (_, i) => 1040 + i),
];

export type ScheduleAlarmInput = {
  id: number;
  title: string;
  body?: string;
  largeBody?: string;
  summaryText?: string;
  extra?: Record<string, unknown>;
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
  scheduleAlarms: (inputs: ScheduleAlarmInput[]) => Promise<void>;
  cancelAlarm: (id: number) => Promise<void>;
  cancelAlarms: (ids: number[]) => Promise<void>;
  listScheduled: () => Promise<Array<{ id: number; title: string }>>;
};

// Android 8+ requires notifications to live on a channel. We create a dedicated
// channel for daily reminders on first use.
const REMINDER_CHANNEL_ID = "reminders";

function isNative() {
  return Capacitor.isNativePlatform();
}

export function ensureReminderChannel(): Promise<void> {
  if (!isNative()) return Promise.resolve();
  return LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: "Daily Insights & Reminders",
    description: "Daily facts, feature tips, and transaction reminders",
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

  // Read the real permission state on mount so callers never see a stale null.
  useEffect(() => {
    resolvePermission().then(setPermission);
  }, [resolvePermission]);

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
    async ({ id, title, body, largeBody, summaryText, extra, at, repeats }: ScheduleAlarmInput): Promise<{ id: string } | null> => {
      if (isNativePlatform) {
        await ensureReminderChannel();
        const result = await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body: body ?? "",
              largeBody: largeBody,
              summaryText: summaryText ?? "Pasona Finance",
              smallIcon: "ic_stat_pasona",
              largeIcon: "pasona_icon",
              iconColor: "#101b45",
              channelId: REMINDER_CHANNEL_ID,
              extra: extra,
              schedule: repeats
                ? {
                    repeats: true,
                    allowWhileIdle: true,
                    on: {
                      hour: at.getHours(),
                      minute: at.getMinutes(),
                    },
                  }
                : {
                    at,
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

  const scheduleAlarms = useCallback(
    async (inputs: ScheduleAlarmInput[]): Promise<void> => {
      if (inputs.length === 0) return;
      if (isNativePlatform) {
        await ensureReminderChannel();
        await LocalNotifications.schedule({
          notifications: inputs.map((input) => ({
            id: input.id,
            title: input.title,
            body: input.body ?? "",
            largeBody: input.largeBody,
            summaryText: input.summaryText ?? "Pasona Finance",
            smallIcon: "ic_stat_pasona",
            largeIcon: "pasona_icon",
            iconColor: "#101b45",
            channelId: REMINDER_CHANNEL_ID,
            extra: input.extra,
            schedule: input.repeats
              ? {
                  repeats: true,
                  allowWhileIdle: true,
                  on: {
                    hour: input.at.getHours(),
                    minute: input.at.getMinutes(),
                  },
                }
              : {
                  at: input.at,
                  allowWhileIdle: true,
                },
          })),
        });
        return;
      }
      if (isSupported && Notification.permission === "granted") {
        for (const input of inputs) {
          new Notification(input.title, { body: input.body });
        }
      }
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

  const cancelAlarms = useCallback(
    async (ids: number[]): Promise<void> => {
      if (ids.length === 0) return;
      if (isNativePlatform) {
        try {
          await LocalNotifications.cancel({
            notifications: ids.map((id) => ({ id })),
          });
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
    scheduleAlarms,
    cancelAlarm,
    cancelAlarms,
    listScheduled,
  };
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

export function nextOccurrenceOfTime(time: string): Date {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export interface AppNotificationScheduleOptions {
  reminderTime: string; // e.g. "21:00" (User-defined reminder time with CTA)
  factTime?: string; // default "09:00" (Morning wisdom & quotes - Info only)
  capabilityTime?: string; // default "14:00" (Afternoon app capabilities & progress - Info only)
  userSeed?: number;
  streak?: number;
  enableEvening?: boolean; // default true
  enableMorning?: boolean; // default false (opt-in to prevent fatigue)
  enableAfternoon?: boolean; // default false (opt-in to prevent fatigue)
}

/**
 * Schedule rolling 7-day notifications for the native app:
 * - Computes distinct, non-repeating copy for each of the next 7 days
 * - Allows user to adjust notification frequency (1x evening check-in by default)
 * - Automatically rolls forward whenever the app is opened
 */
export async function scheduleAllAppNotifications(
  options: AppNotificationScheduleOptions
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await ensureReminderChannel();

  // Cancel prior scheduled notifications before rolling forward
  await cancelAllAppNotifications();

  const factTime = options.factTime ?? "09:00";
  const capabilityTime = options.capabilityTime ?? "14:00";
  const reminderTime = options.reminderTime;
  const userSeed = options.userSeed ?? 0;
  const streak = options.streak ?? 0;

  // Read stored preferences with sensible defaults (1 evening reminder default)
  const enableEvening =
    options.enableEvening ??
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("pasona.notification.evening_enabled") !== "0"
      : true);
  const enableMorning =
    options.enableMorning ??
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("pasona.notification.morning_enabled") === "1"
      : false);
  const enableAfternoon =
    options.enableAfternoon ??
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("pasona.notification.afternoon_enabled") === "1"
      : false);

  const notificationsToSchedule: any[] = [];
  const now = new Date();

  const parseTime = (timeStr: string) => {
    const [h = 0, m = 0] = timeStr.split(":").map(Number);
    return { hours: h, minutes: m };
  };

  const eveningTime = parseTime(reminderTime);
  const morningTime = parseTime(factTime);
  const afternoonTime = parseTime(capabilityTime);

  // Roll through the next 7 days (days 0 through 6)
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + dayOffset);

    // 1. Evening Reminder (Actionable check-in)
    if (enableEvening) {
      const atEvening = new Date(targetDate);
      atEvening.setHours(eveningTime.hours, eveningTime.minutes, 0, 0);

      // Only schedule if this time is in the future
      if (atEvening.getTime() > now.getTime()) {
        const reminder = getDailyReminder(reminderTime, streak, targetDate, userSeed);
        const isLastDay = dayOffset === 6;

        notificationsToSchedule.push({
          id: 1003 + dayOffset,
          title: reminder.title,
          body: reminder.body,
          largeBody: reminder.largeBody,
          summaryText: "Daily Check-in",
          smallIcon: "ic_stat_pasona",
          largeIcon: "pasona_icon",
          iconColor: "#101b45",
          channelId: REMINDER_CHANNEL_ID,
          extra: {
            type: "reminder",
            route: reminder.route,
            dayOffset,
          },
          schedule: isLastDay
            ? {
                at: atEvening,
                repeats: true,
                every: "day",
                allowWhileIdle: true,
              }
            : {
                at: atEvening,
                allowWhileIdle: true,
              },
        });
      }
    }

    // 2. Morning Financial Wisdom (Informative)
    if (enableMorning) {
      const atMorning = new Date(targetDate);
      atMorning.setHours(morningTime.hours, morningTime.minutes, 0, 0);

      if (atMorning.getTime() > now.getTime()) {
        const wisdom = getDailyWisdom(targetDate, userSeed);

        notificationsToSchedule.push({
          id: 1020 + dayOffset,
          title: wisdom.title,
          body: wisdom.body,
          largeBody: wisdom.largeBody,
          summaryText: "Financial Insight",
          smallIcon: "ic_stat_pasona",
          largeIcon: "pasona_icon",
          iconColor: "#101b45",
          channelId: REMINDER_CHANNEL_ID,
          extra: {
            type: "fact",
            item: wisdom.item,
            dayOffset,
          },
          schedule: {
            at: atMorning,
            allowWhileIdle: true,
          },
        });
      }
    }

    // 3. Afternoon App Capability (Spotlight)
    if (enableAfternoon) {
      const atAfternoon = new Date(targetDate);
      atAfternoon.setHours(afternoonTime.hours, afternoonTime.minutes, 0, 0);

      if (atAfternoon.getTime() > now.getTime()) {
        const capability = getDailyCapability(targetDate, userSeed, streak);

        notificationsToSchedule.push({
          id: 1040 + dayOffset,
          title: capability.title,
          body: capability.body,
          largeBody: capability.largeBody,
          summaryText: "Feature Tip",
          smallIcon: "ic_stat_pasona",
          largeIcon: "pasona_icon",
          iconColor: "#101b45",
          channelId: REMINDER_CHANNEL_ID,
          extra: {
            type: "capability",
            route: capability.item.route,
            item: capability.item,
            dayOffset,
          },
          schedule: {
            at: atAfternoon,
            allowWhileIdle: true,
          },
        });
      }
    }
  }

  if (notificationsToSchedule.length > 0) {
    await LocalNotifications.schedule({
      notifications: notificationsToSchedule,
    });
  }
}

/**
 * Cancel all scheduled notifications across all channels and rolling days.
 */
export async function cancelAllAppNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: ALL_APP_NOTIFICATION_IDS.map((id) => ({ id })),
    });
  } catch {
    // best-effort
  }
}
