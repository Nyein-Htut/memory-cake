"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifyBus";

function FoldersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}
function OrdersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20.5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}
function ImagesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5-4 4-3-3-5 5" />
    </svg>
  );
}
function SettingsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
function ExternalIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

// Short, single-idea labels — this is a tab bar, not a sentence. Anything
// longer wraps or crowds the icon on a narrow screen.
const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "相册", icon: FoldersIcon },
  { href: "/admin/orders", label: "订单", icon: OrdersIcon, badgeKey: "newOrders" },
  { href: "/admin/support", label: "客服", icon: ChatIcon, badgeKey: "chat" },
  { href: "/admin/hero-slides", label: "轮播图", icon: ImagesIcon },
  { href: "/admin/settings", label: "设置", icon: SettingsIcon },
];

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifs, setNotifs] = useState({ newOrders: 0, unreadSupportMessages: 0, unreadOrderMessages: 0 });

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) setNotifs(await res.json());
    }
    load();
    const interval = setInterval(load, 15000);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function badgeCount(key) {
    if (key === "newOrders") return notifs.newOrders;
    if (key === "chat") return notifs.unreadSupportMessages + notifs.unreadOrderMessages;
    return 0;
  }

  return (
    <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur-md border-b border-cocoa-200/60 shadow-sm">
      {/* Top row: brand + 2 icon-only utility buttons */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-3">
        <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
          <Image src="/logo.jpg" alt="Memory Cake" width={28} height={28} className="rounded-full object-cover shrink-0" />
          <span className="font-serif font-semibold text-sm text-cocoa-900 truncate">Memory Cake</span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/"
            target="_blank"
            aria-label="查看网站"
            className="flex items-center justify-center w-8 h-8 rounded-full text-cocoa-500 hover:text-cocoa-900 hover:bg-cocoa-100 transition-colors"
          >
            <ExternalIcon className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            aria-label="退出登录"
            className="flex items-center justify-center w-8 h-8 rounded-full text-cocoa-500 hover:text-cocoa-900 hover:bg-cocoa-100 transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav row: equal-width tabs, icon over label — no overflow, no scroll */}
      <nav className="border-t border-cocoa-100">
        <div className="max-w-5xl mx-auto grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const count = badgeCount(item.badgeKey);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-medium transition-colors border-b-2 ${
                  active
                    ? "text-cocoa-900 border-cocoa-800"
                    : "text-cocoa-400 border-transparent hover:text-cocoa-700"
                }`}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
