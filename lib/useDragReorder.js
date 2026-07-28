"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";

// Smooth, touch-friendly drag-to-reorder built on Pointer Events.
//
// How the motion works:
//  - The card you're holding follows your finger/cursor directly and
//    continuously (no lag, recalculated every frame you move).
//  - Cards that get displaced use a FLIP animation (measure old position,
//    let the browser lay them out in the new position, then animate the
//    visual gap between the two) so they glide into place instead of
//    snapping.
//  - Dropping the card eases it from wherever your finger let go into its
//    final resting slot, instead of teleporting.
//
// The whole card is the drag target — a quick tap still behaves as a normal
// click; only a press-and-hold without much movement activates dragging.
// This resolves the "is this a tap or a drag" ambiguity without needing a
// separate handle icon.
//
// Usage:
//   const { draggingId, handlePointerDown, registerItemRef, wasDragRef } =
//     useDragReorder(items, setItems, async (orderedIds) => { ...persist... });
//
//   <div ref={registerItemRef(item.id)} onPointerDown={handlePointerDown(item.id)}>
//
// If the card also navigates (wrapped in a Link), guard the click:
//   onClick={(e) => { if (wasDragRef.current) { e.preventDefault(); wasDragRef.current = false; } }}

const LONG_PRESS_MS = 200;
const MOVE_CANCEL_THRESHOLD = 8; // px of movement before the hold completes -> treat as a scroll, not a drag
const SETTLE_MS = 260; // duration of the "ease into place" animations

export function useDragReorder(items, setItems, onReorderEnd) {
  const [draggingId, setDraggingId] = useState(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const itemRefs = useRef(new Map());
  const registerItemRef = useCallback((id) => (el) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  // Rects captured immediately before a reorder, used to FLIP-animate the
  // cards that get displaced (everything except the one being dragged).
  const prevRects = useRef(null);

  const pointerDownId = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const grabOffset = useRef({ x: 0, y: 0 }); // where inside the card you grabbed it
  const lastPointer = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const dragActivated = useRef(false);

  // Flips true right when a drag ends, so a wrapping <Link>'s click handler
  // (which fires right after pointerup) can be suppressed. Caller resets it.
  const wasDragRef = useRef(false);

  const findClosestId = useCallback((clientX, clientY, excludeId) => {
    let closestId = null;
    let closestDist = Infinity;
    for (const [id, el] of itemRefs.current.entries()) {
      if (id === excludeId) continue;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = (cx - clientX) ** 2 + (cy - clientY) ** 2;
      if (dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }
    return closestId;
  }, []);

  // Repositions the dragged card so it sits exactly under the pointer,
  // regardless of where the grid has just laid it out. Called after every
  // pointer move AND after every reorder (since reordering moves the card's
  // natural/resting slot).
  const trackDraggedCard = useCallback(() => {
    const el = itemRefs.current.get(pointerDownId.current);
    if (!el) return;

    // Read the card's natural (no-transform) position by clearing the
    // transform first. Doing this inside a layout effect / synchronously
    // before paint means it never actually flashes at that position.
    el.style.transition = "none";
    const prevTransform = el.style.transform;
    el.style.transform = "none";
    const rest = el.getBoundingClientRect();
    el.style.transform = prevTransform;

    const targetX = lastPointer.current.x - grabOffset.current.x - rest.left;
    const targetY = lastPointer.current.y - grabOffset.current.y - rest.top;
    el.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.045)`;
  }, []);

  // Plays the FLIP animation for every card except the one being dragged,
  // based on the rects captured right before the reorder happened.
  useLayoutEffect(() => {
    if (!prevRects.current) return;
    const captured = prevRects.current;
    prevRects.current = null;

    for (const [id, el] of itemRefs.current.entries()) {
      if (id === pointerDownId.current) continue;
      const before = captured.get(id);
      if (!before) continue;
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      if (!dx && !dy) continue;

      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      // Force the browser to apply that transform before we animate away
      // from it, otherwise it'd skip straight to the end state.
      // eslint-disable-next-line no-unused-expressions
      el.getBoundingClientRect();
      requestAnimationFrame(() => {
        el.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        el.style.transform = "";
      });
    }

    // The dragged card's resting slot may have shifted too — resync it to
    // the pointer so it doesn't lag behind the reorder it just caused.
    if (dragActivated.current) trackDraggedCard();
  }, [items, trackDraggedCard]);

  const onPointerMoveRef = useRef();
  const onPointerUpRef = useRef();

  const clearListeners = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMoveRef.current);
    window.removeEventListener("pointerup", onPointerUpRef.current);
    clearTimeout(longPressTimer.current);
    document.body.style.touchAction = "";
    document.body.style.userSelect = "";
  }, []);

  onPointerMoveRef.current = (e) => {
    lastPointer.current = { x: e.clientX, y: e.clientY };

    if (!dragActivated.current) {
      // Too much movement before the hold completes -> this is a scroll
      // gesture, not a drag. Bail out cleanly.
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD) {
        clearListeners();
        clearTimeout(longPressTimer.current);
        pointerDownId.current = null;
      }
      return;
    }

    e.preventDefault(); // stop the page from scrolling once dragging is live
    trackDraggedCard();

    const targetId = findClosestId(e.clientX, e.clientY, pointerDownId.current);
    if (targetId === null) return;

    const current = itemsRef.current;
    const fromIndex = current.findIndex((it) => it.id === pointerDownId.current);
    const toIndex = current.findIndex((it) => it.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    // Capture current positions BEFORE reordering state, so the layout
    // effect above can FLIP-animate everyone into their new spot.
    const rects = new Map();
    for (const [id, el] of itemRefs.current.entries()) {
      rects.set(id, el.getBoundingClientRect());
    }
    prevRects.current = rects;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
  };

  onPointerUpRef.current = () => {
    clearListeners();

    const wasActivated = dragActivated.current;
    const draggedId = pointerDownId.current;
    dragActivated.current = false;
    pointerDownId.current = null;
    setDraggingId(null);

    if (!wasActivated) return;

    wasDragRef.current = true;

    // Ease the card from wherever the finger let go into its真正 resting
    // slot, instead of snapping there instantly.
    const el = itemRefs.current.get(draggedId);
    if (el) {
      const before = el.getBoundingClientRect();
      el.style.transition = "none";
      el.style.transform = "none";
      const after = el.getBoundingClientRect();
      const dx = before.left - after.left;
      const dy = before.top - after.top;

      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.045)`;
      // eslint-disable-next-line no-unused-expressions
      el.getBoundingClientRect();
      requestAnimationFrame(() => {
        el.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${SETTLE_MS}ms ease`;
        el.style.transform = "";
        el.style.boxShadow = "";
        el.style.zIndex = "";
      });
    }

    const orderedIds = itemsRef.current.map((it) => it.id);
    onReorderEnd(orderedIds);
  };

  const handlePointerDown = useCallback(
    (id) => (e) => {
      pointerDownId.current = id;
      startPos.current = { x: e.clientX, y: e.clientY };
      lastPointer.current = { x: e.clientX, y: e.clientY };
      dragActivated.current = false;

      const el = itemRefs.current.get(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        grabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }

      longPressTimer.current = setTimeout(() => {
        dragActivated.current = true;
        setDraggingId(id);
        document.body.style.touchAction = "none";
        document.body.style.userSelect = "none";
        if (navigator.vibrate) navigator.vibrate(12);

        const dragEl = itemRefs.current.get(id);
        if (dragEl) {
          dragEl.style.transition = "transform 120ms ease, box-shadow 120ms ease";
          dragEl.style.boxShadow = "0 18px 38px rgba(63, 47, 36, 0.28)";
          dragEl.style.zIndex = "50";
          dragEl.style.willChange = "transform";
        }
        trackDraggedCard();
      }, LONG_PRESS_MS);

      window.addEventListener("pointermove", onPointerMoveRef.current, { passive: false });
      window.addEventListener("pointerup", onPointerUpRef.current);
    },
    [trackDraggedCard]
  );

  useEffect(() => () => clearListeners(), [clearListeners]);

  return { draggingId, handlePointerDown, registerItemRef, wasDragRef };
}
