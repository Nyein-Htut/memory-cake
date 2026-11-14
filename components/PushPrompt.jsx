"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const PHONE_KEY = "memory_cake_phone";
const DISMISS_KEY = "memory_cake_push_dismissed";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function PushPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState("hidden"); // hidden | ask | ios-install
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isAdminArea = pathname?.startsWith("/admin");
  const isLogin = pathname === "/admin/login";
  const role = isAdminArea ? "admin" : "customer";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const syncSubscription = useCallback(async () => {
    const phone = localStorage.getItem(PHONE_KEY) || "";
    if (role === "customer" && !phone) throw new Error("no-phone");

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), role, phone }),
    });
    if (!res.ok) throw new Error("subscribe-failed");
  }, [role, publicKey]);

  useEffect(() => {
    async function evaluate() {
      if (isLogin || !publicKey) return setMode("hidden");
      if (role === "customer" && !localStorage.getItem(PHONE_KEY)) return setMode("hidden");

      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";

      // iPhone/iPad: push only works once installed to the Home Screen.
      if (isIOS() && !isStandalone()) {
        return setMode(dismissed ? "hidden" : "ios-install");
      }

      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return setMode("hidden");
      }

      if (Notification.permission === "granted") {
        // Keep the server's record fresh (e.g. phone number changed).
        try {
          await syncSubscription();
        } catch {
          // ignore — will retry next time
        }
        return setMode("hidden");
      }

      if (Notification.permission === "denied") return setMode("hidden");

      setMode(dismissed ? "hidden" : "ask");
    }

    evaluate();
    window.addEventListener("focus", evaluate);
    return () => window.removeEventListener("focus", evaluate);
  }, [pathname, isLogin, role, publicKey, syncSubscription]);

  async function handleEnable() {
    setBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMode("hidden");
        return;
      }
      await syncSubscription();
      setMode("hidden");
    } catch {
      setError("Could not turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  return (
    <div className="fixed left-4 bottom-5 z-[90] max-w-[calc(100vw-6rem)] sm:max-w-sm rounded-2xl bg-cocoa-900 text-cream shadow-2xl p-4">
      {mode === "ask" ? (
        <>
          <p className="text-sm font-medium mb-1">
            {role === "admin" ? "开启通知" : "Turn on notifications"}
          </p>
          <p className="text-xs text-cream/70 mb-3">
            {role === "admin"
              ? "新订单和客户消息会直接弹出提醒。"
              : "Get updates on your order status and replies from us."}
          </p>
          {error && <p className="text-xs text-red-300 mb-2">{error}</p>}
          <div className="flex gap-3 items-center">
            <button
              onClick={handleEnable}
              disabled={busy}
              className="rounded-full bg-cream text-cocoa-900 px-4 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {busy ? "..." : role === "admin" ? "开启" : "Enable"}
            </button>
            <button onClick={handleDismiss} className="text-xs text-cream/60">
              {role === "admin" ? "以后再说" : "Not now"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium mb-1">Get notifications on iPhone</p>
          <p className="text-xs text-cream/70 mb-3">
            Tap the Share button in Safari, choose <b>Add to Home Screen</b>, then open
            Memory Cake from your home screen and turn notifications on.
          </p>
          <button onClick={handleDismiss} className="text-xs text-cream/60">
            Got it
          </button>
        </>
      )}
    </div>
  );
}
