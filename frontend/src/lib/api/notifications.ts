// Thin API client for the notifications endpoints.

import { api } from "./client";

export type NotificationDto = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaginatedNotifications = {
  data: NotificationDto[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export function listNotifications(page = 1) {
  return api.get<PaginatedNotifications>("/notifications", {
    query: { page },
  });
}

export function getUnreadCount() {
  return api.get<{ count: number }>("/notifications/unread-count");
}

export function markRead(id: number) {
  return api.patch<NotificationDto>(`/notifications/${id}/read`);
}

export function markAllRead() {
  return api.post<{ updated: number }>("/notifications/read-all");
}
