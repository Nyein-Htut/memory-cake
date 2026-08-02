"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";

// Shuffle once per page load
function shuffle(arr: string[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const HERO_IMAGES = [
  "/hero/cake 1.png",
  "/hero/cake 2.png",
  "/hero/cake 3.png",
  "/hero/cake 4.png",
  "/hero/cake 5.png",
  "/hero/cake 6.png",
  "/hero/cake 7.png",
  "/hero/cake 8.png",
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  const slides = useMemo(() => shuffle(HERO_IMAGES), []);
  const [index, setIndex] = useState(0);

  const goTo = useCallback(
    (i: number) =>
      setIndex(((i % slides.length) + slides.length) % slides.length),
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const t = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div
      className="
        relative w-full overflow-hidden rounded-[28px] shadow-xl
        aspect-[16/9] sm:aspect-[16/9]
        lg:h-[540px] lg:aspect-auto
      "
    >
      {/* Soft pink backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff6f8] via-[#ffeef3] to-[#f8e7ef]" />

      {/* Slides */}
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
            className="object-cover object-center"
          />

          {/* Gentle darkening so text stays readable */}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      ))}

      {/* Elegant floating card - MUCH SMALLER on mobile */}
      <div
        className="
          absolute left-3 top-1/2 -translate-y-1/2 z-10
          w-[58%] max-w-[240px]
          sm:left-8 sm:w-[50%] sm:max-w-[360px]
          lg:left-10 lg:w-[42%] lg:max-w-[460px]
        "
      >
        <div
          className="
            rounded-2xl border border-white/50
            bg-white/55 backdrop-blur-xl
            shadow-[0_12px_40px_rgba(0,0,0,0.12)]
            px-4 py-4
            sm:px-6 sm:py-6
            lg:px-8 lg:py-8
          "
        >
          <p
            className="
              flex items-center gap-2
              text-[9px] sm:text-[11px]
              uppercase tracking-[0.28em]
              text-[#7a5a4f] mb-2 sm:mb-3
            "
          >
            <span className="inline-block h-px w-4 sm:w-5 bg-[#c9a58f]" />
            Memory Cake
            <span className="text-[#b88b7a]">♥</span>
          </p>

          <h1
            className="
              font-serif font-semibold leading-[1.05]
              text-[#3f2a22]
              text-xl sm:text-3xl lg:text-5xl
            "
          >
            记忆蛋糕坊
          </h1>

          <p
            className="
              mt-2 sm:mt-3
              text-[11px] sm:text-sm lg:text-lg
              leading-snug text-[#5a463f]
            "
          >
            用心制作每一份甜蜜回忆
          </p>

          <div className="mt-3 sm:mt-4 h-px w-10 sm:w-14 bg-[#d7b6a7]/70" />

          <p
            className="
              mt-3 sm:mt-4
              text-[11px] sm:text-sm lg:text-base
              text-[#6b5248]
            "
          >
            欢迎欣赏我们的蛋糕作品 🎂
          </p>

          <a
            href="#albums"
            className="
              inline-flex items-center gap-2
              mt-4 sm:mt-6
              rounded-full
              bg-[#5a3d34] text-white
              px-4 py-2 text-[11px]
              sm:px-5 sm:py-2.5 sm:text-sm
              lg:px-6 lg:py-3 lg:text-base
              font-medium
              hover:bg-[#4a3129]
              transition-colors
              shadow-md
            "
          >
            探索作品
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      {/* Prev */}
      <button
        onClick={prev}
        aria-label="Previous"
        className="
          absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20
          flex items-center justify-center
          w-8 h-8 sm:w-10 sm:h-10
          rounded-full
          bg-white/70 backdrop-blur-md
          text-[#5a3d34] text-lg sm:text-xl
          shadow-md hover:bg-white/90 transition
        "
      >
        ‹
      </button>

      {/* Next */}
      <button
        onClick={next}
        aria-label="Next"
        className="
          absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20
          flex items-center justify-center
          w-8 h-8 sm:w-10 sm:h-10
          rounded-full
          bg-white/70 backdrop-blur-md
          text-[#5a3d34] text-lg sm:text-xl
          shadow-md hover:bg-white/90 transition
        "
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-5 bg-[#5a3d34]"
                : "w-1.5 bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
