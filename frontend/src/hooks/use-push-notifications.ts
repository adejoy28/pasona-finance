// Push notification hook. Converted from TanStack Start server functions
// to client-side API calls.
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { push as pushApi } from "@/lib/api";

export type PushPermission = "prompt" | "granted" | "denied" | "unsupported";

export type PushNotificationStatus = {
  isSupported: boolean;
  isConfigured: boolean;
  permission: PushPermission;
  isSubscribed: boolean;
  subscribing: boolean;
  error: string | null;
};

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64.replace(/=+$/, "");
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getActiveSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

async function getVapidPublicKey(): Promise<{
  status: "configured" | "not_configured";
  publicKey: string | null;
}> {
  try {
    return await api.post("/push/vapid-key");
  } catch {
    return { status: "not_configured", publicKey: null };
  }
}

async function sendTestPushToServer(data: {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  title: string;
  body?: string;
  url?: string;
}): Promise<void> {
  await api.post("/push/send", data);
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscriptionState = useCallback(async () => {
    const sub = await getActiveSubscription();
    setIsSubscribed(sub !== null);
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(
      Notification.permission === "granted"
        ? "granted"
        : Notification.permission === "denied"
          ? "denied"
          : "prompt",
    );

    getVapidPublicKey()
      .then((result) => {
        if (result.status === "configured") {
          setIsConfigured(true);
        }
      })
      .catch(() => {});

    refreshSubscriptionState();
  }, [refreshSubscriptionState]);

  const subscribe = useCallback(async () => {
    setError(null);
    setIsSubscribed(true);
    setSubscribing(true);

    try {
      const config = await getVapidPublicKey();
      if (config.status !== "configured" || !config.publicKey) {
        setError("Push notifications are not configured on the server.");
        await refreshSubscriptionState();
        return false;
      }

      if (Notification.permission === "denied") {
        setError("Notification permission was denied.");
        await refreshSubscriptionState();
        return false;
      }

      let perm: NotificationPermission = Notification.permission;
      if (perm === "default") {
        perm = await Notification.requestPermission();
        setPermission(perm === "granted" ? "granted" : "denied");
      }

      if (perm !== "granted") {
        setError("Permission not granted.");
        await refreshSubscriptionState();
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey).slice()
            .buffer as ArrayBuffer,
        });
      }

      const subJson = subscription.toJSON();

      try {
        await pushApi.saveSubscription({
          endpoint: subJson.endpoint!,
          keys: subJson.keys as { p256dh: string; auth: string },
        });
      } catch {
        setError(
          "Subscribed on this device, but failed to save to server. Notifications may not deliver.",
        );
      }

      await refreshSubscriptionState();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
      await refreshSubscriptionState();
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [refreshSubscriptionState]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setIsSubscribed(false);
    setSubscribing(true);

    try {
      const subscription = await getActiveSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await pushApi.deleteSubscription(endpoint).catch(() => {});
      await refreshSubscriptionState();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      await refreshSubscriptionState();
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [refreshSubscriptionState]);

  const sendTestPush = useCallback(async () => {
    setError(null);

    try {
      const subscription = await getActiveSubscription();
      if (!subscription) {
        setError("No active push subscription found. Subscribe first.");
        return false;
      }

      const subJson = subscription.toJSON();
      await sendTestPushToServer({
        subscription: {
          endpoint: subJson.endpoint!,
          keys: subJson.keys as { p256dh: string; auth: string },
        },
        title: "Test Notification",
        body: "This is a test push from Pasona. Notifications are working!",
        url: "/",
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send test notification";
      setError(message);
      return false;
    }
  }, []);

  return {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    subscribing,
    error,
    subscribe,
    unsubscribe,
    sendTestPush,
  } as PushNotificationStatus & {
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    sendTestPush: () => Promise<boolean>;
  };
}
