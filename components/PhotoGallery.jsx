"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { cldThumb, cldFull } from "@/lib/cloudinary-url";
import OrderModal from "@/components/OrderModal";

export default function PhotoGallery({
  folderId,
  folderName,
  orderable = true,
  orderFormType = "cake",
  dessertOptions = [],
  dessertMinQuantity = 6,
  initialPhotos,
  total,
  pageSize = 24,
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeIndex, setActiveIndex] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [orderingPhoto, setOrderingPhoto] = useState(null);

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
  }, [
    folderId,
    photos.length,
    pageSize,
    loadingMore,
    hasMore,
  ]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  const close = useCallback(
    () => setActiveIndex(null),
    []
  );

  const showPrev = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null
          ? null
          : (i - 1 + photos.length) % photos.length
      ),
    [photos.length]
  );

  const showNext = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null
          ? null
          : (i + 1) % photos.length
      ),
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

    return () =>
      window.removeEventListener("keydown", onKey);
  }, [
    activeIndex,
    close,
    showPrev,
    showNext,
  ]);

  function handleTouchStart(e) {
    touchStartX.current =
      e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;

    const delta =
      e.changedTouches[0].clientX -
      touchStartX.current;

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="group rounded-2xl overflow-hidden bg-white border border-cocoa-200 shadow-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <button
              onClick={() => setActiveIndex(i)}
              className="relative aspect-square w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-cocoa-500"
            >
              <Image
                src={cldThumb(photo.url, 400)}
                alt={
                  photo.caption ||
                  "Memory Cake photo"
                }
                fill
                sizes="(max-width:640px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            </button>

            {/* ORDER BUTTON */}
            {orderable && (
              <div className="p-2.5 sm:p-3">
                <button
                  onClick={() =>
                    setOrderingPhoto(photo)
                  }
                  className="w-full rounded-lg bg-cocoa-800 text-cream text-xs sm:text-sm py-2 font-medium hover:bg-cocoa-900 transition-colors"
                >
                  🎂 订购此蛋糕
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div
          ref={sentinelRef}
          className="py-10 text-center text-cocoa-400 text-sm"
        >
          {loadingMore
            ? "Loading more photos..."
            : ""}
        </div>
      )}

      {/* FULLSCREEN PHOTO VIEWER */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-3"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* CLOSE */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-3xl transition z-10"
            aria-label="Close"
          >
            &times;
          </button>

          {/* PREVIOUS */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-4xl transition z-10"
            aria-label="Previous"
          >
            &#8249;
          </button>

          {/* IMAGE */}
          <div
            className="relative w-full max-w-5xl h-[65vh] sm:h-[75vh]"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <Image
              src={cldFull(
                photos[activeIndex].url,
                1600
              )}
              alt={
                photos[activeIndex].caption ||
                "Memory Cake photo"
              }
              fill
              sizes="100vw"
              priority
              className="object-contain rounded-xl"
            />
          </div>

          {/* NEXT */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-4xl transition z-10"
            aria-label="Next"
          >
            &#8250;
          </button>

          {/* CAPTION + ORDER */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {photos[activeIndex].caption && (
              <div className="max-w-3xl px-6 py-3 rounded-full bg-black/40 backdrop-blur text-white text-sm text-center">
                {photos[activeIndex].caption}
              </div>
            )}

            {/* ORDER BUTTON IN FULLSCREEN */}
            {orderable && (
              <button
                onClick={() =>
                  setOrderingPhoto(
                    photos[activeIndex]
                  )
                }
                className="rounded-lg bg-cocoa-800 text-cream px-5 py-2.5 text-sm font-medium hover:bg-cocoa-900 transition-colors"
              >
                🎂 订购此蛋糕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ORDER MODAL */}
       {orderable && orderingPhoto && (
        <OrderModal
          photo={orderingPhoto}
          folderId={folderId}
          folderName={folderName}
          orderFormType={orderFormType}
          dessertOptions={dessertOptions}
          minQuantity={dessertMinQuantity}
          onClose={() => setOrderingPhoto(null)}
        />
      )}
    </>
  );
}
