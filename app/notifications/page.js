"use client";

import { useState, useEffect, useCallback } from "react";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import OrderChatPanel from "@/components/OrderChatPanel";
import SupportChatPanel from "@/components/SupportChatPanel";

export default function NotificationsPage() {
  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [showSupportChat, setShowSupportChat] = useState(false);

  const load = useCallback(
    async (p) => {
      const target = (p ?? phone).trim();
      if (!target) return;
      setLoading(true);
      const res = await fetch(`/api/notifications?phone=${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
      setLoading(false);
    },
    [phone]
  );

  useEffect(() => {
    const saved = localStorage.getItem("memory_cake_phone");
    if (saved) {
      setPhone(saved);
      load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleUsePhone(e) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    localStorage.setItem("memory_cake_phone", phoneInput.trim());
    setPhone(phoneInput.trim());
    load(phoneInput.trim());
  }

  function handleChangeNumber() {
    localStorage.removeItem("memory_cake_phone");
    setPhone("");
    setPhoneInput("");
    setItems([]);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F0E6DA]">
      <PublicHeader />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-12">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-cocoa-900 mb-2">Notifications</h1>
        <p className="text-cocoa-500 text-sm mb-2">Updates from us about your orders and messages.</p>

        {phone && (
          <p className="text-xs text-cocoa-400 mb-8">
            Showing updates for {phone} ·{" "}
            <button
              type="button"
              onClick={handleChangeNumber}
              className="underline hover:text-cocoa-700"
            >
              Not you? Change number
            </button>
          </p>
        )}

        {!phone ? (
          <form onSubmit={handleUsePhone} className="flex flex-col sm:flex-row gap-3 max-w-md mt-6">
            <div className="relative flex-1">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Your phone number"
                className="w-full rounded-lg border border-cocoa-200 bg-white px-4 py-3 pr-10 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
              />
              {phoneInput && (
                <button
                  type="button"
                  onClick={() => setPhoneInput("")}
                  aria-label="Clear"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-cocoa-100 text-lg leading-none transition-colors"
                >
                  &times;
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-cocoa-800 text-cream px-5 py-3 font-medium hover:bg-cocoa-900"
            >
              Continue
            </button>
          </form>
        ) : loading ? (
          <p className="text-cocoa-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-cocoa-400">You're all caught up — no new updates.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === "order") setActiveOrderId(item.order_id);
                  else setShowSupportChat(true);
                }}
                className="w-full text-left bg-white rounded-2xl border border-cocoa-100 shadow-card p-4 hover:border-cocoa-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-cocoa-500">
                    {item.type === "order" ? `Order #${item.order_id}` : "Memory Cake"}
                  </span>
                  <span className="text-[10px] text-cocoa-400">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-cocoa-900">{item.message || "📎 Sent an attachment"}</p>
              </button>
            ))}
          </div>
        )}
      </main>

      {activeOrderId && (
        <OrderChatPanel
          orderId={activeOrderId}
          role="customer"
          phone={phone}
          onClose={() => {
            setActiveOrderId(null);
            load();
          }}
        />
      )}
      {showSupportChat && (
        <SupportChatPanel
          phone={phone}
          role="customer"
          onClose={() => {
            setShowSupportChat(false);
            load();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
