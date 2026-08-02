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
