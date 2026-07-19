import Link from "next/link";
import Image from "next/image";

export default function PublicHeader() {
  return (
    <header className="border-b border-cocoa-200/60 bg-cream/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Memory Cake logo"
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
          <span className="font-serif font-medium text-3xl text-cocoa-900 tracking-wide">
            Memory Cake
          </span>
        </Link>
        <span className="text-xs uppercase tracking-[0.2em] text-cocoa-400">
          Photo Albums
        </span>
      </div>
    </header>
  );
}
