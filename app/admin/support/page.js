"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import SupportChatPanel from "@/components/SupportChatPanel";

export default function AdminSupportPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhone, setActivePhone] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/support/threads");
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-serif font-medium text-3xl text-cocoa-900 mb-6">客服聊天</h1>
        {loading ? (
          <p className="text-cocoa-400">Loading...</p>
        ) : threads.length === 0 ? (
          <p className="text-cocoa-400">暂无客户消息。</p>
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <button
                key={t.phone}
                onClick={() => setActivePhone(t.phone)}
                className="w-full text-left bg-white rounded-2xl border border-cocoa-100 shadow-card p-4 hover:border-cocoa-300 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-cocoa-900">{t.phone}</p>
                  <p className="text-sm text-cocoa-500 truncate">{t.last_message}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-cocoa-400">{new Date(t.last_message_at).toLocaleString()}</span>
                  {t.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {activePhone && (
        <SupportChatPanel
          phone={activePhone}
          role="admin"
          onClose={() => {
            setActivePhone(null);
            load();
          }}
        />
      )}
    </div>
  );
}
