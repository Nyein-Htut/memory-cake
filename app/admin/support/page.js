"use client";

import { useEffect, useState, useMemo } from "react";
import AdminHeader from "@/components/AdminHeader";
import SupportChatPanel from "@/components/SupportChatPanel";

const CUSTOMERS_PREVIEW_COUNT = 5;

export default function AdminSupportPage() {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAllCustomers, setShowAllCustomers] = useState(false);

  const [activePhone, setActivePhone] = useState(null);

  async function loadThreads() {
    setLoadingThreads(true);
    const res = await fetch("/api/support/threads");
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
    }
    setLoadingThreads(false);
  }

  async function loadCustomers() {
    setLoadingCustomers(true);
    const res = await fetch("/api/customers");
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers || []);
    }
    setLoadingCustomers(false);
  }

  useEffect(() => {
    loadThreads();
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => (c.wechat_name || "").toLowerCase().includes(q));
  }, [customers, customerSearch]);

  const visibleCustomers = showAllCustomers
    ? filteredCustomers
    : filteredCustomers.slice(0, CUSTOMERS_PREVIEW_COUNT);

  function openChat(phone) {
    setActivePhone(phone);
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-serif font-medium text-3xl text-cocoa-900 mb-6">客服聊天</h1>

        {loadingThreads ? (
          <p className="text-cocoa-400">Loading...</p>
        ) : threads.length === 0 ? (
          <p className="text-cocoa-400">暂无客户消息。</p>
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <button
                key={t.phone}
                onClick={() => openChat(t.phone)}
                className="w-full text-left bg-white rounded-2xl border border-cocoa-100 shadow-card p-4 hover:border-cocoa-300 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-cocoa-900 truncate">{t.wechat_name || t.phone}</p>
                  {t.wechat_name && (
                    <p className="text-xs text-cocoa-400 truncate">{t.phone}</p>
                  )}
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

        {/* ---- Ordered customers ---- */}
        <section className="mt-10 sm:mt-12">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-serif text-xl sm:text-2xl text-cocoa-900">已下单客户</h2>
          </div>

          <input
            type="text"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setShowAllCustomers(false);
            }}
            placeholder="按微信昵称搜索..."
            className="w-full rounded-lg border border-cocoa-200 bg-white px-4 py-2.5 text-sm text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500 mb-4"
          />

          {loadingCustomers ? (
            <p className="text-cocoa-400 text-sm">Loading...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-cocoa-400 text-sm">
              {customerSearch ? "没有找到匹配的客户。" : "暂无客户订单记录。"}
            </p>
          ) : (
            <>
              <div className="space-y-2.5">
                {visibleCustomers.map((c) => (
                  <div
                    key={c.phone}
                    className="flex items-center justify-between gap-3 bg-white rounded-xl border border-cocoa-100 shadow-sm px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-cocoa-900 truncate">{c.wechat_name || "未填写昵称"}</p>
                      <p className="text-xs text-cocoa-400 truncate">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => openChat(c.phone)}
                      className="shrink-0 rounded-full bg-cocoa-800 text-cream text-xs sm:text-sm px-3.5 py-1.5 font-medium hover:bg-cocoa-900 transition-colors"
                    >
                      💬 发消息
                    </button>
                  </div>
                ))}
              </div>

              {!showAllCustomers && filteredCustomers.length > CUSTOMERS_PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllCustomers(true)}
                  className="mt-4 text-sm text-cocoa-700 hover:text-cocoa-900 font-medium"
                >
                  查看更多（共 {filteredCustomers.length} 位客户）
                </button>
              )}
              {showAllCustomers && filteredCustomers.length > CUSTOMERS_PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllCustomers(false)}
                  className="mt-4 text-sm text-cocoa-500 hover:text-cocoa-800 font-medium"
                >
                  收起
                </button>
              )}
            </>
          )}
        </section>
      </main>

      {activePhone && (
        <SupportChatPanel
          phone={activePhone}
          role="admin"
          onClose={() => {
            setActivePhone(null);
            loadThreads();
          }}
        />
      )}
    </div>
  );
}
