import Link from "next/link";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-cocoa-200/50 bg-[#F0E6DA]/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-3 min-w-0"
        >
          <Image
            src="/logo.jpg"
            alt="Memory Cake logo"
            width={44}
            height={44}
            className="rounded-full object-cover shrink-0 w-10 h-10 sm:w-11 sm:h-11 shadow-sm"
          />

          <span className="font-serif font-semibold text-2xl sm:text-3xl text-cocoa-900 tracking-wide truncate">
            Memory Cake
          </span>
        </Link>

        <span className="hidden sm:inline text-xs uppercase tracking-[0.25em] text-cocoa-500 shrink-0">
          Photo Albums
        </span>
      </div>
    </header>
  );
}
