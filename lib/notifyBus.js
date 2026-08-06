// Whenever something marks order/support messages (or orders) as "seen",
// broadcast this so any visible notification badge on the page can refetch
// its count immediately instead of waiting for its poll interval.
export const NOTIFICATIONS_CHANGED_EVENT = "memory-cake:notifications-changed";

export function notifyNotificationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}
