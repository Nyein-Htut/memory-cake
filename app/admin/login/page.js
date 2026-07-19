"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cocoa-900 px-6">
      <div className="w-full max-w-sm bg-cream rounded-2xl shadow-soft p-8">
        <h1 className="font-serif text-2xl text-cocoa-900 text-center mb-1">
          Memory Cake
        </h1>
        <p className="text-cocoa-400 text-center text-sm mb-8">Admin sign in</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-cocoa-500 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-cocoa-200 bg-white px-3 py-2 text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cocoa-800 text-cream py-2.5 font-medium hover:bg-cocoa-900 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
