"use client";

import { useState, useEffect } from "react";
import SupportChatPanel from "./SupportChatPanel";

function ChatBubbleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export default function ChatWidget() {
  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("memory_cake_phone");
    if (saved) setPhone(saved);
  }, []);

  function handleStartChat(e) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    localStorage.setItem("memory_cake_phone", phoneInput.trim());
    setPhone(phoneInput.trim());
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat with us"
        className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-cocoa-800 text-cream shadow-xl hover:bg-cocoa-900 hover:scale-105 transition-all"
      >
        <ChatBubbleIcon className="w-6 h-6" />
      </button>

      {open &&
        (phone ? (
          <SupportChatPanel phone={phone} role="customer" onClose={() => setOpen(false)} />
        ) : (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full sm:max-w-sm bg-cream rounded-t-2xl sm:rounded-2xl shadow-soft p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-serif text-lg text-cocoa-900 mb-1">Chat with us</h2>
              <p className="text-xs text-cocoa-400 mb-4">
                Enter your phone number so we know who we're chatting with.
              </p>
              <form onSubmit={handleStartChat} className="space-y-3">
                <input
                  type="tel"
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                />
                <button type="submit" className="w-full rounded-lg bg-cocoa-800 text-cream py-2.5 text-sm font-medium hover:bg-cocoa-900">
                  Start chat
                </button>
              </form>
              <button onClick={() => setOpen(false)} className="w-full mt-2 text-xs text-cocoa-400 py-1">
                Cancel
              </button>
            </div>
          </div>
        ))}
    </>
  );
}
