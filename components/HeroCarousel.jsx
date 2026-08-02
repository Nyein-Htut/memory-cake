"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";

// Fisher–Yates — order is randomized once per page load/refresh.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Drop your 8 cake photos in /public/hero/ using these filenames
// (or edit this list to match whatever names you actually use).
const HERO_IMAGES = [
  "/hero/cake 1.jpg",
  "/hero/cake 2.jpg",
  "/hero/cake 3.jpg",
  "/hero/cake 4.jpg",
  "/hero/cake 5.jpg",
  "/hero/cake 6.jpg",
  "/hero/cake 7.jpg",
  "/hero/cake 8.jpg",
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  // useMemo -> shuffled once per mount, not on every render.
  const slides = useMemo(() => shuffle(HERO_IMAGES), []);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (i) => setIndex(((i % slides.length) + slides.length) % slides.length),
    [slides.length]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-soft h-[380px] sm:h-[440px] md:h-[480px] lg:h-[540px]">
      {/* Soft fallback backdrop so uneven/odd-shaped photos never show a hard edge */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7e3d7] via-[#f0d9cf] to-[#e9cfc9]" />

      {slides.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt="Memory Cake showcase"
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Frosted text panel, left side, over the photo */}
      <div className="absolute inset-y-0 left-0 flex items-center w-[80%] sm:w-[62%] md:w-[52%] lg:w-[44%] px-4 sm:px-8 md:px-12">
        <div className="w-full rounded-2xl bg-white/35 backdrop-blur-md border border-white/40 shadow-lg px-5 py-6 sm:px-7 sm:py-8 md:px-9 md:py-10">
          <p className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-cocoa-700 mb-3">
            <span className="inline-block w-5 h-px bg-cocoa-500" />
            Memory Cake
            <span className="text-cocoa-500">&hearts;</span>
          </p>

          <h1 className="font-serif font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-cocoa-900 leading-tight">
            记忆蛋糕坊
          </h1>

          <p className="mt-3 text-sm sm:text-base md:text-lg text-cocoa-700">
            用心制作每一份甜蜜回忆
          </p>

          <div className="mt-4 sm:mt-5 h-px w-14 bg-cocoa-400/60" />

          <p className="mt-4 text-cocoa-600 text-sm sm:text-base md:text-lg">
            欢迎欣赏我们的蛋糕作品 🎂
          </p>

          <a
            href="#albums"
            className="inline-flex items-center gap-2 mt-6 rounded-full bg-cocoa-800 text-cream px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium hover:bg-cocoa-900 transition-colors shadow-md"
          >
            探索作品 <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/50 backdrop-blur hover:bg-white/70 text-cocoa-800 flex items-center justify-center text-xl transition"
      >
        &#8249;
      </button>
      <button
        onClick={next}
        aria-label="Next"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/50 backdrop-blur hover:bg-white/70 text-cocoa-800 flex items-center justify-center text-xl transition"
      >
        &#8250;
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-cocoa-800" : "w-1.5 bg-cocoa-800/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
