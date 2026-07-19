"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

export default function PhotoGallery({ photos }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, showPrev, showNext]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setActiveIndex(i)}
            className="relative aspect-square rounded-xl overflow-hidden bg-cocoa-100 group focus:outline-none focus:ring-2 focus:ring-cocoa-500"
          >
            <Image
              src={photo.url}
              alt={photo.caption || "Memory Cake photo"}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-cocoa-950/90 flex items-center justify-center px-4"
          onClick={close}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-5 right-5 text-cream/80 hover:text-cream text-3xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-3 md:left-8 text-cream/70 hover:text-cream text-4xl px-2 select-none"
            aria-label="Previous"
          >
            &#8249;
          </button>

          <div
            className="relative max-w-4xl max-h-[80vh] w-full h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[activeIndex].url}
              alt={photos[activeIndex].caption || "Memory Cake photo"}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-3 md:right-8 text-cream/70 hover:text-cream text-4xl px-2 select-none"
            aria-label="Next"
          >
            &#8250;
          </button>

          {photos[activeIndex].caption && (
            <p className="absolute bottom-6 left-0 right-0 text-center text-cream/90 text-sm px-8">
              {photos[activeIndex].caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
