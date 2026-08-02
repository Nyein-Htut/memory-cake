"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 22v-8.5h2.85l.43-3.31H13.5V8.05c0-.96.27-1.61 1.64-1.61h1.75V3.5A23.7 23.7 0 0 0 14.6 3.3c-2.44 0-4.11 1.49-4.11 4.22v2.66H7.63v3.31h2.86V22h3.01Z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.15" cy="6.85" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WeChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9.5 3.8C5.4 3.8 2 6.6 2 10.1c0 2 1.1 3.8 2.9 5l-.7 2.2 2.4-1.2c.9.3 1.9.5 2.9.5h.3a5.9 5.9 0 0 1-.2-1.6c0-3.5 3.5-6.4 7.9-6.4h.2C16.9 5.6 13.5 3.8 9.5 3.8ZM7 8.6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
      <path d="M16.4 10.7c-3.6 0-6.4 2.4-6.4 5.3s2.8 5.3 6.4 5.3c.8 0 1.6-.1 2.3-.4l2 1-.6-1.9c1.4-1 2.3-2.4 2.3-4 0-2.9-2.9-5.3-6-5.3Zm-2.2 3.3a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.4 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z" />
    </svg>
  );
}

export default function Footer() {
  const [copied, setCopied] = useState(false);

  function copyWeChatId() {
    navigator.clipboard?.writeText("Memorycake2023");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <footer className="relative mt-16 sm:mt-24 bg-gradient-to-b from-cocoa-950 to-[#1c130d] text-cream/80">
      {/* Gold hairline accent along the top edge */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#d4ac86] to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.jpg"
                alt="Memory Cake logo"
                width={42}
                height={42}
                className="rounded-full object-cover shadow-md"
              />
              <span className="font-serif font-semibold text-2xl text-cream tracking-wide">
                Memory Cake
              </span>
            </div>
            <p className="text-sm leading-relaxed text-cream/60 max-w-xs">
              Handcrafted cakes, made with care and dressed to remember.
              Every order is a small ceremony — we treat it like one.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-serif text-lg text-cream mb-4 tracking-wide">
              Explore
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-cream/60 hover:text-[#e8d1b8] transition-colors">
                  Albums
                </Link>
              </li>
              <li>
                <a href="#albums" className="text-cream/60 hover:text-[#e8d1b8] transition-colors">
                  Our Work
                </a>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-cream/60 hover:text-[#e8d1b8] transition-colors"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-serif text-lg text-cream mb-4 tracking-wide">
              Connect
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.facebook.com/share/1BcMCykvYP/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-cream/60 hover:text-[#e8d1b8] transition-colors"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full border border-cream/15 group-hover:border-[#e8d1b8]/60 transition-colors">
                    <FacebookIcon className="w-4 h-4" />
                  </span>
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/memory_cake_2024?igsh=MW15eGExdjM4NWdwYg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 text-cream/60 hover:text-[#e8d1b8] transition-colors"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full border border-cream/15 group-hover:border-[#e8d1b8]/60 transition-colors">
                    <InstagramIcon className="w-4 h-4" />
                  </span>
                  Instagram
                </a>
              </li>
              <li>
                <button
                  onClick={copyWeChatId}
                  className="group flex items-center gap-3 text-cream/60 hover:text-[#e8d1b8] transition-colors text-left"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full border border-cream/15 group-hover:border-[#e8d1b8]/60 transition-colors shrink-0">
                    <WeChatIcon className="w-4 h-4" />
                  </span>
                  <span>
                    WeChat: Memorycake2023
                    <span className="block text-[11px] text-cream/35 group-hover:text-[#e8d1b8]/70">
                      {copied ? "Copied!" : "Tap to copy ID"}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 sm:mt-14 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream/40 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Memory Cake. All rights reserved.
          </p>
          <p className="font-serif text-xs tracking-[0.25em] uppercase text-[#d4ac86]/70">
            Crafted with care, since 2023
          </p>
        </div>
      </div>
    </footer>
  );
}
