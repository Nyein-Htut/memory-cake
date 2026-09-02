"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { cldThumb, cldFull } from "@/lib/cloudinary-url";
import OrderModal from "@/components/OrderModal";

function ShareIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5 15.4 6.5" />
      <path d="M8.6 13.5 15.4 17.5" />
    </svg>
  );
}

async function sharePhoto(photo, folderName) {
  const shareUrl = cldFull(photo.url, 1600);
  const shareText = photo.caption || "快来看看这款蛋糕！";
  const shareTitle = folderName ? `${folderName} · Memory Cake` : "Memory Cake";

  try {
    if (navigator.canShare) {
      const res = await fetch(shareUrl);
      const blob = await res.blob();
      const file = new File([blob], "memory-cake-photo.jpg", { type: blob.type || "image/jpeg" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
        return;
      }
    }
    if (navigator.share) {
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      return;
    }
    await navigator.clipboard?.writeText(shareUrl);
    alert("图片链接已复制，可粘贴到微信分享给好友");
  } catch (err) {
    if (err?.name !== "AbortError") {
      try {
        await navigator.clipboard?.writeText(shareUrl);
        alert("图片链接已复制，可粘贴到微信分享给好友");
      } catch {
        // ignore — nothing more we can do
      }
    }
  }
}

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
  }, [folderId, photos.length, pageSize, loadingMore, hasMore]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  const close = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? null : (i - 1 + photos.length) % photos.length
      ),
    [photos.length]
  );

  const showNext = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? null : (i + 1) % photos.length
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

    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, showPrev, showNext]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;

    const delta = e.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(delta) > 50) {
      if (delta > 0) showPrev();
      else showNext();
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
                alt={photo.caption || "Memory Cake photo"}
                fill
                sizes="(max-width:640px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            </button>

            {/* ACTION ROW — share on the left (obvious, always visible),
                order button shrunk and pinned to the right. */}
            <div className="p-2.5 sm:p-3 flex items-center gap-2">
              <button
                onClick={() => sharePhoto(photo, folderName)}
                className="shrink-0 flex items-center gap-1 rounded-lg border border-cocoa-300 bg-white text-cocoa-700 text-xs px-2.5 py-2 font-medium hover:bg-cocoa-50 hover:border-cocoa-400 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                分享到微信
              </button>

              {orderable ? (
                <button
                  onClick={() => setOrderingPhoto(photo)}
                  className="ml-auto shrink-0 rounded-lg bg-cocoa-800 text-cream text-xs sm:text-sm px-3 py-2 font-medium hover:bg-cocoa-900 transition-colors"
                >
                  🎂 订购
                </button>
              ) : (
                <div
                  className="flex-1 min-w-0 rounded-lg bg-cocoa-50 border border-cocoa-200 text-cocoa-800 text-xs sm:text-sm py-2 text-center truncate"
                  title={photo.caption || undefined}
                >
                  {photo.caption || "价格请咨询客服"}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="py-10 text-center text-cocoa-400 text-sm">
          {loadingMore ? "Loading more photos..." : ""}
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
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-5 right-5 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-3xl transition z-10"
            aria-label="Close"
          >
            &times;
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); showPrev(); }}
            className="absolute left-4 sm:left-8 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-4xl transition z-10"
            aria-label="Previous"
          >
            &#8249;
          </button>

          <div
            className="relative w-full max-w-5xl h-[65vh] sm:h-[75vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={cldFull(photos[activeIndex].url, 1600)}
              alt={photos[activeIndex].caption || "Memory Cake photo"}
              fill
              sizes="100vw"
              priority
              className="object-contain rounded-xl"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); showNext(); }}
            className="absolute right-4 sm:right-8 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-4xl transition z-10"
            aria-label="Next"
          >
            &#8250;
          </button>

          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-md px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {orderable ? (
              <>
                {photos[activeIndex].caption && (
                  <div className="max-w-3xl px-6 py-3 rounded-full bg-black/40 backdrop-blur text-white text-sm text-center">
                    {photos[activeIndex].caption}
                  </div>
                )}
                <div className="flex items-center gap-3 w-full justify-center">
                  <button
                    onClick={() => sharePhoto(photos[activeIndex], folderName)}
                    className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 backdrop-blur text-white px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    <ShareIcon className="w-4 h-4" />
                    分享到微信
                  </button>
                  <button
                    onClick={() => setOrderingPhoto(photos[activeIndex])}
                    className="rounded-full bg-cocoa-800 text-cream px-4 py-2.5 text-sm font-medium hover:bg-cocoa-900 transition-colors"
                  >
                    🎂 订购
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 w-full justify-center">
                <button
                  onClick={() => sharePhoto(photos[activeIndex], folderName)}
                  className="flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 backdrop-blur text-white px-4 py-2.5 text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  <ShareIcon className="w-4 h-4" />
                  分享到微信
                </button>
                <div className="px-6 py-2.5 rounded-full bg-black/40 backdrop-blur text-white text-sm text-center font-medium">
                  {photos[activeIndex].caption || "价格请咨询客服"}
                </div>
              </div>
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
