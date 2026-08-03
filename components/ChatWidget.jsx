"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SupportChatPanel from "./SupportChatPanel";

function ChatBubbleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("memory_cake_phone");
    if (saved) setPhone(saved);
  }, []);

  function handleStartChat(e) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    localStorage.setItem("memory_cake_phone", phoneInput.trim());
    setPhone(phoneInput.trim());
  }

  // Wait for client mount before portaling — document.body doesn't exist during SSR.
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Floating launcher — always pinned to the viewport corner, survives scroll */}
      <div className="fixed bottom-5 right-5 z-[100]">
        {!open && (
          <span className="absolute inset-0 rounded-full bg-cocoa-700 opacity-30 animate-ping pointer-events-none" />
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Chat with us"}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-cocoa-700 to-cocoa-900 text-cream shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-300"
        >
          {open ? <CloseIcon className="w-5 h-5" /> : <ChatBubbleIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Popup — near full-screen sheet on mobile, large floating card on desktop */}
      {open && (
        <div
          className="fixed inset-0 z-[110] bg-black/40 flex items-end justify-center sm:items-end sm:justify-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full h-[94vh] sm:h-[680px] sm:w-[400px] sm:mb-24 sm:mr-6 bg-cream sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {phone ? (
              <SupportChatPanel phone={phone} role="customer" embedded onClose={() => setOpen(false)} />
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 bg-cocoa-900 text-cream shrink-0">
                  <div>
                    <h2 className="font-serif text-lg leading-none">Chat with us</h2>
                    <p className="text-xs text-cream/60 mt-1">We usually reply within a few hours</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-cream/70 hover:text-cream text-xl leading-none"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-center px-6 py-6 bg-[#faf6f0]">
                  <p className="text-sm text-cocoa-500 mb-4">
                    Enter your phone number so we know who we're chatting with.
                  </p>
                  <form onSubmit={handleStartChat} className="space-y-3">
                    <input
                      type="tel"
                      autoFocus
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Your phone number"
                      className="w-full rounded-full border border-cocoa-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-cocoa-800 text-cream py-2.5 text-sm font-medium hover:bg-cocoa-900 transition-colors"
                    >
                      Start chat
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
