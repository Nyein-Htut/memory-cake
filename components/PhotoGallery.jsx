"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { cldThumb, cldFull } from "@/lib/cloudinary-url";

export default function PhotoGallery({ folderId, initialPhotos, total, pageSize = 24 }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeIndex, setActiveIndex] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const touchStartX = useRef(null);
  const sentinelRef = useRef(null);

  const hasMore = photos.length < total;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/folders/${folderId}/photos?limit=${pageSize}&offset=${photos.length}`
      );
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) => [...prev, ...data.photos]);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [folderId, photos.length, pageSize, loadingMore, hasMore]);

  // Infinite scroll: watch a sentinel div near the bottom of the grid and
  // fetch the next page automatically when it scrolls into view.
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" } // start loading before the user hits bottom
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

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

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        showPrev();
      } else {
        showNext();
      }
    }
    touchStartX.current = null;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            onClick={() => setActiveIndex(i)}
            className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-cocoa-100 group focus:outline-none focus:ring-2 focus:ring-cocoa-500"
          >
            <Image
              src={cldThumb(photo.url, 400)}
              alt={photo.caption || "Memory Cake photo"}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-8 text-center text-cocoa-300 text-xs">
          {loadingMore ? "Loading more photos..." : ""}
        </div>
      )}

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-cocoa-950/95 flex items-center justify-center px-2"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-cream/80 hover:text-cream w-11 h-11 flex items-center justify-center text-3xl leading-none z-10"
            aria-label="Close"
          >
            &times;
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-0 sm:left-6 w-12 h-12 flex items-center justify-center text-cream/70 hover:text-cream text-4xl select-none z-10"
            aria-label="Previous"
          >
            &#8249;
          </button>

          <div
            className="relative max-w-4xl max-h-[75vh] w-full h-[65vh] sm:h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={cldFull(photos[activeIndex].url, 1600)}
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
            className="absolute right-0 sm:right-6 w-12 h-12 flex items-center justify-center text-cream/70 hover:text-cream text-4xl select-none z-10"
            aria-label="Next"
          >
            &#8250;
          </button>

          {photos[activeIndex].caption && (
            <p className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center text-cream/90 text-sm px-10">
              {photos[activeIndex].caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
