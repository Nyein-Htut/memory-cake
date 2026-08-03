"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function OrderChatPanel({ orderId, role, phone, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    const qs = isAdmin ? "" : `?phone=${encodeURIComponent(phone)}`;
    const res = await fetch(`/api/orders/${orderId}/messages${qs}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
    }
    setLoading(false);
  }, [orderId, isAdmin, phone]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // light polling for replies
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message: draft.trim() }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not send message");
      return;
    }

    setDraft("");
    load();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-cream rounded-t-2xl sm:rounded-2xl shadow-soft flex flex-col h-[80vh] sm:h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-cocoa-200/60">
          <h2 className="font-serif text-lg text-cocoa-900">
            {isAdmin ? "Message customer" : "Message us"}
          </h2>
          <button onClick={onClose} className="text-cocoa-400 hover:text-cocoa-800 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <p className="text-sm text-cocoa-400 text-center py-6">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-cocoa-400 text-center py-6">
              {isAdmin
                ? "No messages yet. Send a note if you need to confirm anything with the customer."
                : "No messages yet. Ask us anything about payment or delivery fees."}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender === role;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "bg-cocoa-800 text-cream rounded-br-sm"
                        : "bg-white border border-cocoa-200 text-cocoa-900 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-cream/60" : "text-cocoa-400"}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-3 border-t border-cocoa-200/60 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isAdmin ? "Type a message..." : "Ask about payment, delivery fee..."}
            className="flex-1 rounded-full border border-cocoa-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-cocoa-800 text-cream px-4 py-2 text-sm font-medium hover:bg-cocoa-900 disabled:opacity-50"
          >
            Send
          </button>
        </form>
        {error && <p className="text-xs text-red-600 px-4 pb-2">{error}</p>}
      </div>
    </div>
  );
}
