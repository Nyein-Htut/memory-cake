"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import OrderChatPanel from "@/components/OrderChatPanel";

const STATUS_LABELS = {
  new: "新订单",
  confirmed: "已确认",
  done: "已完成",
  cancelled: "已取消",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  async function load() {
    setLoading(true);
    const url = filter ? `/api/orders?status=${filter}` : "/api/orders";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id, status) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function deleteOrder(id) {
    if (!confirm("删除这条订单记录？此操作无法撤销。")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <h1 className="font-serif font-medium text-3xl text-cocoa-900 mb-6">订购信息</h1>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["", "new", "confirmed", "done", "cancelled"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                filter === s
                  ? "bg-cocoa-800 text-cream border-cocoa-800"
                  : "border-cocoa-200 text-cocoa-600 hover:border-cocoa-400"
              }`}
            >
              {s ? STATUS_LABELS[s] : "全部"}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <p className="text-cocoa-400">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-cocoa-400">暂无订购信息。</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const cakeImage = o.photo_url || o.photo_path || o.photoUrl;

              return (
                <div key={o.id} className="bg-white rounded-2xl border border-cocoa-100 shadow-card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Cake Photo Thumbnail */}
                    <div className="shrink-0 flex sm:block items-center justify-between">
                      {cakeImage ? (
                        <div
                          onClick={() => setPreviewImage(cakeImage)}
                          className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-cocoa-100 bg-cocoa-50 cursor-pointer group shadow-sm"
                        >
                          <img
                            src={cakeImage}
                            alt="Cake Preview"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                            放大查看
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-cocoa-50 border border-cocoa-100 flex flex-col items-center justify-center text-cocoa-300 text-xs">
                          <span className="text-2xl mb-1">🎂</span>
                          无图片
                        </div>
                      )}

                      {/* Status Dropdown (Mobile view position) */}
                      <div className="sm:hidden">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="text-xs font-medium rounded-lg border border-cocoa-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                        >
                          {Object.entries(STATUS_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Order Information Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-cocoa-400">
                            {new Date(o.created_at).toLocaleString("zh-CN")}
                            {o.folder_name ? ` · ${o.folder_name}` : ""}
                          </p>
                          <p className="font-serif font-semibold text-lg text-cocoa-900 mt-0.5">
                            {o.size_label || o.sizeLabel} {o.size_price || o.sizePrice ? `· MMK ${o.size_price || o.sizePrice}` : ""}
                          </p>
                          <p className="text-sm font-medium text-cocoa-700 mt-1">
                            {[o.flavor, o.filling].filter(Boolean).join(" · ") || "未指定口味/夹心"}
                          </p>
                        </div>

                        {/* Status Dropdown (Desktop view position) */}
                        <div className="hidden sm:block shrink-0">
                          <select
                            value={o.status}
                            onChange={(e) => updateStatus(o.id, e.target.value)}
                            className="text-xs font-medium rounded-lg border border-cocoa-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-cocoa-500 bg-white"
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-cocoa-700 pt-2 border-t border-cocoa-100/60">
                        <p><span className="text-cocoa-400">配送日期：</span>{o.delivery_date || "未填写"} {o.delivery_time || ""}</p>
                        <p><span className="text-cocoa-400">配送地址：</span>{o.delivery_place || "未填写"}</p>
                        <p><span className="text-cocoa-400">联系电话：</span>{o.phone || "未填写"}</p>
                      </div>

                      {o.remark && (
                        <p className="mt-2 text-sm text-cocoa-700 bg-cocoa-50/80 border border-cocoa-100 rounded-lg px-3 py-1.5">
                          备注：{o.remark}
                        </p>
                      )}

                      <div className="mt-3 text-right">
                        <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                          删除订单
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Image Preview Modal */}
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
    </div>
  );
}
