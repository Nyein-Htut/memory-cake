"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifyBus";

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function NotificationBell() {
  const [phone, setPhone] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(
    async (p) => {
      const target = p ?? phone;
      if (!target) return;
      const res = await fetch(`/api/notifications?phone=${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    },
    [phone]
  );

  useEffect(() => {
    const saved = localStorage.getItem("memory_cake_phone");
    if (saved) {
      setPhone(saved);
      refresh(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!phone) return;
    const interval = setInterval(() => refresh(), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  useEffect(() => {
  function onChanged() { refresh(); }
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);
  
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative flex items-center justify-center shrink-0 rounded-full border border-cocoa-200 bg-white/70 w-9 h-9 sm:w-10 sm:h-10 text-cocoa-700 hover:text-cocoa-900 hover:border-cocoa-400 hover:bg-white transition-colors"
    >
      <BellIcon className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
      )}
    </Link>
  );
}
