"use client";

import { useState, useEffect, useCallback } from "react";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import OrderChatPanel from "@/components/OrderChatPanel";

const STATUS_LABELS = { new: "New", confirmed: "Confirmed", done: "Completed", cancelled: "Cancelled" };
const STATUS_STYLES = {
  new: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

function canCancel(order) {
  if (order.status === "cancelled" || order.status === "done") return false;
  if (!order.delivery_date) return true;
  const deliveryAt = new Date(`${order.delivery_date}T${order.delivery_time || "00:00"}:00`);
  if (Number.isNaN(deliveryAt.getTime())) return true;
  const hoursUntil = (deliveryAt.getTime() - Date.now()) / (1000 * 60 * 60);
  return hoursUntil >= 24;
}

export default function MyOrdersPage() {
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [chatOrderId, setChatOrderId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const lookup = useCallback(async (phoneToLookup) => {
    const p = (phoneToLookup ?? phone).trim();
    if (!p) return;

    setLoading(true);
    setError("");

    try {
      // Added cache: "no-store" & timestamp query param to force fresh DB fetch every time
      const res = await fetch(`/api/orders/lookup?phone=${encodeURIComponent(p)}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      setLoading(false);

      if (!res.ok) {
        setError("Could not load orders. Please try again.");
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setSubmittedPhone(p);
      localStorage.setItem("memory_cake_phone", p);
    } catch (err) {
      setLoading(false);
      setError("Could not load orders. Please try again.");
    }
  }, [phone]);

  useEffect(() => {
    const saved = localStorage.getItem("memory_cake_phone");
    if (saved) {
      setPhone(saved);
      lookup(saved);
    }
  }, [lookup]);
  
  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState !== "visible") return;
      const saved = localStorage.getItem("memory_cake_phone");
      if (saved) lookup(saved);
    }

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [lookup]);

  async function handleCancel(order) {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setCancellingId(order.id);

    const res = await fetch(`/api/orders/${order.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: submittedPhone }),
    });

    setCancellingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not cancel order.");
      return;
    }

    lookup(submittedPhone);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F0E6DA]">
      <PublicHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-12">
        <h1 className="font-serif font-semibold text-3xl sm:text-4xl text-cocoa-900 mb-2">My Orders</h1>
        <p className="text-cocoa-500 text-sm mb-8">
          Enter the phone number you used when ordering to see your order status.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); lookup(); }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
            className="flex-1 rounded-lg border border-cocoa-200 bg-white px-4 py-3 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cocoa-800 text-cream px-5 py-3 font-medium hover:bg-cocoa-900 disabled:opacity-60"
          >
            {loading ? "Looking up..." : "View my orders"}
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

        {submittedPhone && !loading && orders.length === 0 && !error && (
          <p className="text-cocoa-400">No orders found for that phone number.</p>
        )}

        <div className="space-y-4">
          {orders.map((order) => {
            const cancellable = canCancel(order);
            const cakeImage = order.photo_url;

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-cocoa-100 shadow-card p-4 sm:p-5">
                <div className="flex gap-4">
                  {cakeImage ? (
                    <div
                      onClick={() => setPreviewImage(cakeImage)}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-cocoa-100 bg-cocoa-50 cursor-pointer group shadow-sm"
                    >
                      <img
                        src={cakeImage}
                        alt="Cake"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium">
                        放大查看
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-cocoa-50 border border-cocoa-100 flex items-center justify-center text-2xl">
                      🎂
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-cocoa-400">
                          {new Date(order.created_at).toLocaleString()}
                          {order.folder_name ? ` · ${order.folder_name}` : ""}
                        </p>
                        <p className="font-serif font-semibold text-lg text-cocoa-900 mt-0.5">
                          {order.size_label} {order.size_price ? `· MMK ${order.size_price}` : ""}
                        </p>
                        <p className="text-sm text-cocoa-700 mt-1">
                          {[order.flavor, order.filling1, order.filling2].filter(Boolean).join(" · ") || "No flavor specified"}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[order.status] || "bg-cocoa-100 text-cocoa-700"}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-cocoa-100/60 text-sm text-cocoa-700 space-y-1">
                      <p><span className="text-cocoa-400">Delivery:</span> {order.delivery_date || "Not set"} {order.delivery_time || ""}</p>
                      <p><span className="text-cocoa-400">Address:</span> {order.delivery_place}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setChatOrderId(order.id)}
                        className="text-sm text-cocoa-700 hover:text-cocoa-900 font-medium flex items-center gap-1.5"
                      >
                        💬 Message us
                      </button>

                      {order.status !== "cancelled" && order.status !== "done" && (
                        <button
                          onClick={() => handleCancel(order)}
                          disabled={!cancellable || cancellingId === order.id}
                          title={!cancellable ? "Orders can't be cancelled within 24 hours of delivery" : ""}
                          className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {cancellingId === order.id ? "Cancelling..." : "Cancel order"}
                        </button>
                      )}
                      {!cancellable && order.status !== "cancelled" && order.status !== "done" && (
                        <span className="text-xs text-cocoa-400">Can't cancel within 24h of delivery — message us instead</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={previewImage}
              alt="Enlarged Cake View"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full"
            >
              ✕ 关闭
            </button>
          </div>
        </div>
      )}

      {chatOrderId && (
        <OrderChatPanel orderId={chatOrderId} role="customer" phone={submittedPhone} onClose={() => setChatOrderId(null)} />
      )}

      <Footer />
    </div>
  );
}
