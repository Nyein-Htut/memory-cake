"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-cocoa-200/60 bg-cream sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Memory Cake logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <span className="font-serif font-medium text-3xl text-cocoa-900 tracking-wide">
            Memory Cake
          </span>
          <span className="text-[10px] uppercase tracking-widest bg-cocoa-800 text-cream px-2 py-0.5 rounded-full">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            target="_blank"
            className="text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            View site &rarr;
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-cocoa-500 hover:text-cocoa-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
