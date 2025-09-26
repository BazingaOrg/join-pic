"use client";

import { useEffect, useState } from "react";
import { dismissNotification, useNotificationStore } from "@/store/notification-store";

const VARIANT_STYLES = {
  info: {
    accent: "from-white/35 via-white/16 to-transparent",
    border: "border-white/20",
    text: "text-[var(--color-text)]",
    icon: "bg-white/14 text-white",
  },
  success: {
    accent: "from-white/32 via-white/14 to-transparent",
    border: "border-white/24",
    text: "text-[var(--color-text)]",
    icon: "bg-white/14 text-white",
  },
  warning: {
    accent: "from-white/38 via-white/18 to-transparent",
    border: "border-white/28",
    text: "text-[var(--color-text)]",
    icon: "bg-white/14 text-white",
  },
  danger: {
    accent: "from-white/45 via-white/22 to-transparent",
    border: "border-white/32",
    text: "text-[var(--color-text)]",
    icon: "bg-white/14 text-white",
  },
} as const;

export function NotificationCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    setVisible(notifications.map((item) => item.id));
  }, [notifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4 sm:items-end sm:px-6">
      {notifications.map((notification) => {
        const styles = VARIANT_STYLES[notification.variant];
        const isVisible = visible.includes(notification.id);
        return (
          <div
            key={notification.id}
            className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border ${styles.border} bg-black/80 backdrop-blur-md shadow-xl ring-1 ring-white/5 transition duration-300 ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
          >
            <div className={`h-1 w-full bg-gradient-to-r ${styles.accent}`} />
            <div className="flex items-start gap-3 px-4 py-3">
              <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${styles.icon}`}>
                {getVariantIcon(notification.variant)}
              </div>
              <div className="flex-1 space-y-1">
                {notification.title && (
                  <p className={`text-sm font-semibold ${styles.text}`}>{notification.title}</p>
                )}
                <p className={`whitespace-pre-line text-sm leading-relaxed ${styles.text}`}>
                  {notification.message}
                </p>
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-2 flex justify-center flex-wrap gap-2">
                    {notification.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        className="rounded-full border border-white/18 px-3 py-1 text-xs font-medium text-[var(--color-text)] transition hover:border-white/28 hover:bg-white/5"
                        onClick={() => {
                          action.onClick();
                          dismissNotification(notification.id);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                onClick={() => dismissNotification(notification.id)}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getVariantIcon(variant: string) {
  switch (variant) {
    case "success":
      return "✓";
    case "warning":
      return "!";
    case "danger":
      return "!";
    default:
      return "i";
  }
}
