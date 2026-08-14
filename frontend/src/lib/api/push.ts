import { api } from "./client";

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function saveSubscription(subscription: PushSubscriptionPayload): Promise<void> {
  await api.post("/push/subscriptions", subscription);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  await api.delete("/push/subscriptions", { body: { endpoint } });
}
