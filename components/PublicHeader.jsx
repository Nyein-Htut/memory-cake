import Link from "next/link";
import Image from "next/image";

function ShoppingBagIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8h12l-1 12.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 20.5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-cocoa-200/50 bg-[#F0E6DA]/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1"
        >
          <Image
            src="/logo.jpg"
            alt="Memory Cake logo"
            width={44}
            height={44}
            className="rounded-full object-cover shrink-0 w-10 h-10 sm:w-11 sm:h-11 shadow-sm"
          />

          <span className="font-serif font-semibold text-xl sm:text-3xl text-cocoa-900 tracking-wide truncate">
            Memory Cake (记忆蛋糕坊)
          </span>
        </Link>

        <Link
          href="/orders"
          aria-label="My Orders"
          className="flex items-center gap-1.5 shrink-0 rounded-full border border-cocoa-200 bg-white/70 px-2.5 sm:px-3.5 py-2 text-cocoa-700 hover:text-cocoa-900 hover:border-cocoa-400 hover:bg-white transition-colors"
        >
          <ShoppingBagIcon className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">
            My Orders
          </span>
        </Link>
      </div>
    </header>
  );
}
