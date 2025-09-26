"use client";

import { create } from "zustand";

export type NotificationVariant = "info" | "success" | "warning" | "danger";

export type NotificationAction = {
  label: string;
  onClick: () => void;
};

export type NotificationEntry = {
  id: string;
  title?: string;
  message: string;
  variant: NotificationVariant;
  createdAt: number;
  duration: number;
  actions?: NotificationAction[];
};

type ShowNotificationPayload = {
  title?: string;
  message: string;
  variant?: NotificationVariant;
  duration?: number;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: NotificationEntry[];
  showNotification: (payload: ShowNotificationPayload) => string;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
};

const DEFAULT_DURATION = 4800;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  showNotification: ({ title, message, variant = "info", duration = DEFAULT_DURATION, actions }) => {
    const id = crypto.randomUUID();
    const entry: NotificationEntry = {
      id,
      title,
      message,
      variant,
      createdAt: Date.now(),
      duration,
      actions,
    };
    set((state) => ({ notifications: [...state.notifications, entry] }));

    if (duration > 0) {
      window.setTimeout(() => {
        get().dismissNotification(id);
      }, duration);
    }

    return id;
  },
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}));

export function showNotification(payload: ShowNotificationPayload) {
  return useNotificationStore.getState().showNotification(payload);
}

export function dismissNotification(id: string) {
  useNotificationStore.getState().dismissNotification(id);
}

