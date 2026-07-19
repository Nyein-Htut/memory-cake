import Link from "next/link";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="border-b border-cocoa-200/60 bg-cream/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Image
            src="/logo.jpg"
            alt="Memory Cake logo"
            width={36}
            height={36}
            className="rounded-full object-cover shrink-0 w-9 h-9 sm:w-11 sm:h-11"
          />
          <span className="font-serif font-medium text-xl sm:text-3xl text-cocoa-900 tracking-wide truncate">
            Memory Cake
          </span>
        </Link>
        <span className="hidden sm:inline text-xs uppercase tracking-[0.2em] text-cocoa-400 shrink-0">
          Photo Albums
        </span>
      </div>
    </header>
  );
}
