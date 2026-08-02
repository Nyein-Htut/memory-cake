"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";

function shuffle(arr) {
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
    (i) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div
      className="
        relative
        w-full
        overflow-hidden
        rounded-[28px]
        shadow-xl

        aspect-[16/9]

        sm:h-[420px]

        lg:h-[540px]
      "
    >
      {/* Soft Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-[#fff7fa] via-[#fff1f5] to-[#fde9f0]" />

      {/* Images */}

      {slides.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt="Memory Cake"

            fill

            priority={i === 0}

            sizes="100vw"

            className="
              object-cover

              object-[72%_center]

              sm:object-center
            "
          />

          {/* very subtle dark overlay */}

          <div className="absolute inset-0 bg-black/5" />
        </div>
      ))}
            {/* ===== Floating Badge ===== */}

      <div
        className="
          absolute

          left-3
          bottom-3

          z-20

          max-w-[175px]

          sm:left-8
          sm:top-1/2
          sm:bottom-auto
          sm:-translate-y-1/2

          sm:max-w-[360px]

          lg:max-w-[470px]
        "
      >
        <div
          className="
            rounded-2xl

            border border-white/30

            bg-white/18

            backdrop-blur-sm

            shadow-xl

            px-3
            py-3

            sm:px-7
            sm:py-7

            transition-all
          "
        >
          <p
            className="
              flex
              items-center
              gap-2

              uppercase

              tracking-[0.22em]

              text-[8px]

              sm:text-[11px]

              text-[#74564a]
            "
          >
            <span className="h-px w-4 bg-[#c69b87]" />

            Memory Cake

            <span>♥</span>
          </p>

          <h1
            className="
              mt-2

              font-serif

              font-semibold

              leading-none

              text-[#3f2a22]

              text-lg

              sm:text-4xl

              lg:text-6xl
            "
          >
            记忆蛋糕坊
          </h1>

          {/* Desktop only */}

          <p className="hidden sm:block mt-4 text-[#5d4b45] text-base leading-relaxed">
            用心制作每一份甜蜜回忆
          </p>

          <div className="hidden sm:block mt-5 h-px w-16 bg-[#d8b8ab]" />

          <p className="hidden sm:block mt-5 text-[#6d554d] text-base">
            欢迎欣赏我们的蛋糕作品 🎂
          </p>

          <a
            href="#albums"
            className="
              inline-flex
              items-center
              gap-2

              mt-3

              sm:mt-7

              rounded-full

              bg-[#5b3c33]

              text-white

              text-[10px]

              sm:text-base

              font-medium

              px-3

              py-1.5

              sm:px-6

              sm:py-3

              transition-all

              hover:bg-[#4b2f28]
            "
          >
            Explore

            <span>→</span>
          </a>
        </div>
      </div>
            {/* Previous */}
      <button
        onClick={prev}
        aria-label="Previous"
        className="
          absolute
          left-3
          top-1/2
          -translate-y-1/2
          z-30

          flex
          items-center
          justify-center

          w-8
          h-8

          sm:w-11
          sm:h-11

          rounded-full

          bg-white/25

          backdrop-blur-md

          border
          border-white/40

          text-white

          text-lg
          sm:text-2xl

          transition-all
          duration-300

          hover:bg-white/40
          hover:scale-105
        "
      >
        ‹
      </button>

      {/* Next */}
      <button
        onClick={next}
        aria-label="Next"
        className="
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          z-30

          flex
          items-center
          justify-center

          w-8
          h-8

          sm:w-11
          sm:h-11

          rounded-full

          bg-white/25

          backdrop-blur-md

          border
          border-white/40

          text-white

          text-lg
          sm:text-2xl

          transition-all
          duration-300

          hover:bg-white/40
          hover:scale-105
        "
      >
        ›
      </button>

      {/* Dots */}
      <div
        className="
          absolute

          bottom-3

          left-1/2

          -translate-x-1/2

          z-30

          flex

          gap-2
        "
      >
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`
              rounded-full
              transition-all
              duration-300

              ${
                i === index
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}
