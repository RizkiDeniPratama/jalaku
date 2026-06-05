/**
 * Jalaku — Notification Store (Nano Stores)
 *
 * Dummy notification data for the admin dashboard.
 * State management for the notification bell badge and popover.
 */

import { atom, computed } from "nanostores";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "order" | "booking" | "system" | "review";
}

// Dummy notifications untuk demo
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Pesanan Baru",
    message: "Andi Pratama memesan 3 item senilai Rp 150.000",
    time: "5 menit lalu",
    isRead: false,
    type: "order",
  },
  {
    id: "n2",
    title: "Booking Dikonfirmasi",
    message: "Booking #BK-0042 telah dikonfirmasi oleh pelanggan",
    time: "15 menit lalu",
    isRead: false,
    type: "booking",
  },
  {
    id: "n3",
    title: "Review Baru ⭐⭐⭐⭐⭐",
    message: "Siti Rahayu memberikan rating 5 bintang untuk Kopi Arabika",
    time: "1 jam lalu",
    isRead: false,
    type: "review",
  },
  {
    id: "n4",
    title: "Stok Menipis",
    message: "Stok Gula Aren tersisa 5 unit. Segera restock!",
    time: "2 jam lalu",
    isRead: true,
    type: "system",
  },
  {
    id: "n5",
    title: "Pesanan Selesai",
    message: "Pesanan #ORD-0128 telah selesai dikirim",
    time: "3 jam lalu",
    isRead: true,
    type: "order",
  },
];

/** All notifications */
export const $notifications = atom<Notification[]>(INITIAL_NOTIFICATIONS);

/** Unread count for the badge */
export const $unreadCount = computed($notifications, (notifs) =>
  notifs.filter((n) => !n.isRead).length
);

/** Mark a single notification as read */
export function markAsRead(id: string): void {
  $notifications.set(
    $notifications.get().map((n) => (n.id === id ? { ...n, isRead: true } : n))
  );
}

/** Mark all notifications as read */
export function markAllAsRead(): void {
  $notifications.set(
    $notifications.get().map((n) => ({ ...n, isRead: true }))
  );
}
