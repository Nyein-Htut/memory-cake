"use client";

import { useState, useEffect, useCallback } from "react";
import OrderChatPanel from "./OrderChatPanel";
import SupportChatPanel from "./SupportChatPanel";

export default function NotificationsPanel({ phone, onPhoneChange, onClose }) {
  const [phoneInput, setPhoneInput] = useState(phone || "");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [showSupportChat, setShowSupportChat] = useState(false);

  const load = useCallback(
    async (p) => {
      const target = p ?? phone;
      if (!target) {
        setLoading(false);
        return;
      }
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
    load();
  }, [load]);

  function handleUsePhone(e) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    localStorage.setItem("memory_cake_phone", phoneInput.trim());
    onPhoneChange(phoneInput.trim());
    load(phoneInput.trim());
  }

  function handleChangeNumber() {
    localStorage.removeItem("memory_cake_phone");
    setPhoneInput("");
    setItems([]);
    onPhoneChange("");
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-6"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-cream sm:rounded-2xl shadow-soft flex flex-col h-full sm:h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-cocoa-200/60">
          <h2 className="font-serif text-lg text-cocoa-900">Notifications</h2>
          <button onClick={onClose} className="text-cocoa-400 hover:text-cocoa-800 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {phone && (
            <p className="text-xs text-cocoa-400 -mt-1 mb-1">
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
            <form onSubmit={handleUsePhone} className="space-y-3">
              <p className="text-sm text-cocoa-500">Enter your phone number to see updates from us.</p>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 pr-9 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />
                {phoneInput && (
                  <button
                    type="button"
                    onClick={() => setPhoneInput("")}
                    aria-label="Clear"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-cocoa-400 hover:text-cocoa-700 hover:bg-cocoa-100 text-lg leading-none transition-colors"
                  >
                    &times;
                  </button>
                )}
              </div>
              <button type="submit" className="w-full rounded-lg bg-cocoa-800 text-cream py-2.5 text-sm font-medium hover:bg-cocoa-900">
                Continue
              </button>
            </form>
          ) : loading ? (
            <p className="text-sm text-cocoa-400 text-center py-6">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-cocoa-400 text-center py-6">You're all caught up — no new updates.</p>
          ) : (
            items.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === "order") setActiveOrderId(item.order_id);
                  else setShowSupportChat(true);
                }}
                className="w-full text-left bg-white rounded-xl border border-cocoa-100 shadow-card p-3.5 hover:border-cocoa-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-cocoa-500">
                    {item.type === "order" ? `Order #${item.order_id}` : "Memory Cake"}
                  </span>
                  <span className="text-[10px] text-cocoa-400">{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-cocoa-900 truncate">{item.message || "📎 Sent an attachment"}</p>
              </button>
            ))
          )}
        </div>
      </div>

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
    </div>
  );
}
