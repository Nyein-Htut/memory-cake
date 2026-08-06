"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifyBus";

export default function AdminHeader() {
  const router = useRouter();
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

  return (
    <header className="border-b border-cocoa-200/60 bg-cream sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">

        {/* Logo + Brand */}
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 sm:gap-3 min-w-0"
        >
          <Image
            src="/logo.jpg"
            alt="Memory Cake logo"
            width={36}
            height={36}
            className="rounded-full object-cover shrink-0 sm:w-10 sm:h-10"
          />

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif font-medium text-lg sm:text-3xl text-cocoa-900 tracking-wide truncate">
              Memory Cake
            </span>

            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest bg-cocoa-800 text-cream px-2 py-0.5 rounded-full shrink-0">
              Admin
            </span>
          </div>
        </Link>


        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Link
            href="/admin/orders"
            className="relative text-xs sm:text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            订购信息
            {notifs.newOrders > 0 && (
              <span className="absolute -top-1.5 -right-2 w-2.5 h-2.5 rounded-full bg-red-500 border border-cream" />
            )}
          </Link>

          <Link
            href="/admin/support"
            className="relative text-xs sm:text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            客服聊天
            {notifs.unreadSupportMessages + notifs.unreadOrderMessages > 0 && (
              <span className="absolute -top-1.5 -right-2 w-2.5 h-2.5 rounded-full bg-red-500 border border-cream" />
            )}
          </Link>

          <Link
            href="/admin/settings"
            className="text-xs sm:text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            设置
          </Link>

          <Link
            href="/"
            target="_blank"
            className="text-xs sm:text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            <span className="hidden sm:inline">View site →</span>
            <span className="sm:hidden">Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
