"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";

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

        {loading ? (
          <p className="text-cocoa-400">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-cocoa-400">暂无订购信息。</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-cocoa-100 shadow-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-cocoa-400">
                      {new Date(o.created_at).toLocaleString("zh-CN")}
                      {o.folder_name ? ` · ${o.folder_name}` : ""}
                    </p>
                    <p className="font-serif text-lg text-cocoa-900 mt-1">
                      {o.size_label} {o.size_price ? `· ¥${o.size_price}` : ""}
                    </p>
                    <p className="text-sm text-cocoa-600 mt-1">
                      {[o.flavor, o.filling].filter(Boolean).join(" · ") || "未指定口味/夹心"}
                    </p>
                  </div>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="text-xs rounded-lg border border-cocoa-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-cocoa-700">
                  <p><span className="text-cocoa-400">配送日期：</span>{o.delivery_date || "未填写"} {o.delivery_time || ""}</p>
                  <p><span className="text-cocoa-400">配送地址：</span>{o.delivery_place}</p>
                  <p><span className="text-cocoa-400">联系电话：</span>{o.phone}</p>
                </div>

                {o.remark && (
                  <p className="mt-2 text-sm text-cocoa-600 bg-cocoa-50 rounded-lg px-3 py-2">
                    备注：{o.remark}
                  </p>
                )}

                <div className="mt-3 text-right">
                  <button onClick={() => deleteOrder(o.id)} className="text-xs text-red-500 hover:text-red-700">
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
