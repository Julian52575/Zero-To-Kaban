import type { ApiNotification } from "../types/Notification";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  // PATCH endpoints may return 204/empty body
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export function fetchUnreadNotifications() {
  return request<ApiNotification[]>("/notifications/unread");
}

export function markNotificationAsRead(id: string) {
  return request<void>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsAsRead() {
  return request<void>("/notifications/read", { method: "PATCH" });
}

export function deleteNotification(id: string) {
  return request<void>(`/notifications/${id}`, { method: "DELETE" });
}
