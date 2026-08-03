"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { uploadChatAttachment } from "@/lib/uploadChatAttachment";

function PaperclipIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
function senderLabel(senderRole, viewerRole) {
  if (senderRole === viewerRole) return "You";
  return viewerRole === "admin" ? "Customer" : "Memory Cake";
}

export default function OrderChatPanel({ orderId, role, phone, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage({ message, attachmentUrl, attachmentType }) {
    setError("");
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message, attachmentUrl, attachmentType }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not send message");
    }
    await load();
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendMessage({ message: draft.trim() });
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url, type } = await uploadChatAttachment(file);
      await sendMessage({ message: null, attachmentUrl: url, attachmentType: type });
    } catch (err) {
      setError(err.message || "Could not send attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
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
                : "No messages yet. Ask us anything about this order — feel free to attach a receipt or payment QR."}
            </p>
          ) : (
            messages.map((m) => {
            const mine = m.sender === role;
            const label = senderLabel(m.sender, role);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] font-medium text-cocoa-400 mb-1 px-1">{label}</span>
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "bg-cocoa-800 text-cream rounded-br-sm"
                        : "bg-white border border-cocoa-200 text-cocoa-900 rounded-bl-sm"
                    }`}
                  >
                    {m.attachment_url && m.attachment_type === "image" && (
                      <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                        <img src={m.attachment_url} alt="Attachment" className="rounded-lg mb-1.5 max-h-48 object-cover" />
                      </a>
                    )}
                    {m.attachment_url && m.attachment_type === "file" && (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block mb-1.5 underline text-xs ${mine ? "text-cream" : "text-cocoa-700"}`}
                      >
                        📎 View attachment
                      </a>
                    )}
                    {m.message && <p className="whitespace-pre-wrap break-words">{m.message}</p>}
                    <p className={`text-[10px] mt-1 ${mine ? "text-cream/60" : "text-cocoa-400"}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        <form onSubmit={handleSend} className="p-3 border-t border-cocoa-200/60 flex gap-2 items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelected}
            className="hidden"
            id={`order-attach-${orderId}-${role}`}
          />
          <label
            htmlFor={`order-attach-${orderId}-${role}`}
            className={`shrink-0 w-9 h-9 rounded-full border border-cocoa-200 flex items-center justify-center text-cocoa-600 hover:text-cocoa-900 hover:border-cocoa-400 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <PaperclipIcon className="w-4 h-4" />
          </label>
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
        {uploading && <p className="text-xs text-cocoa-400 px-4 pb-2">Uploading attachment...</p>}
        {error && <p className="text-xs text-red-600 px-4 pb-2">{error}</p>}
      </div>
    </div>
  );
}
