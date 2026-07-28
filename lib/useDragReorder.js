"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// Long-press-to-drag, built on Pointer Events (works for touch, mouse, and
// stylus). The whole card is draggable — no separate handle icon needed.
// A quick tap still behaves as a normal click/link; only a press-and-hold
// (~350ms) without much movement activates drag mode. This is the same
// pattern apps like Trello or a phone home screen use, because a touch on
// a card is otherwise ambiguous between "tap to open" and "start a drag."
//
// Usage:
//   const { draggingId, overId, handlePointerDown, registerItemRef, wasDragRef } =
//     useDragReorder(items, setItems, async (orderedIds) => { ...persist... });
//
//   <div ref={registerItemRef(item.id)} onPointerDown={handlePointerDown(item.id)}>
//
// If the card is wrapped in a Link (or has its own onClick), guard it:
//   onClick={(e) => { if (wasDragRef.current) { e.preventDefault(); wasDragRef.current = false; } }}
const LONG_PRESS_MS = 350;
const MOVE_CANCEL_THRESHOLD = 10; // px of movement before drag activates -> treat as scroll instead

export function useDragReorder(items, setItems, onReorderEnd) {
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const itemRefs = useRef(new Map());
  const registerItemRef = useCallback((id) => (el) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  const pointerDownId = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const dragActivated = useRef(false);

  // Set to true right after a drag ends, so the click/navigation that the
  // browser fires immediately after pointerup can be suppressed by the
  // caller. The caller resets it back to false once it's checked it.
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

  const cleanup = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMoveRef.current);
    window.removeEventListener("pointerup", onPointerUpRef.current);
    clearTimeout(longPressTimer.current);
    document.body.style.touchAction = "";
    document.body.style.userSelect = "";
    dragActivated.current = false;
    pointerDownId.current = null;
    setDraggingId(null);
    setOverId(null);
  }, []);

  const onPointerMoveRef = useRef();
  const onPointerUpRef = useRef();

  onPointerMoveRef.current = (e) => {
    if (!dragActivated.current) {
      // Not yet a confirmed drag — if the finger moves too far before the
      // long-press timer fires, this is a scroll gesture, not a drag.
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD) {
        cleanup();
      }
      return;
    }

    e.preventDefault(); // stop page scroll once dragging is active
    const targetId = findClosestId(e.clientX, e.clientY, pointerDownId.current);
    if (targetId === null) return;

    setOverId(targetId);

    const current = itemsRef.current;
    const fromIndex = current.findIndex((it) => it.id === pointerDownId.current);
    const toIndex = current.findIndex((it) => it.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
  };

  onPointerUpRef.current = () => {
    const wasActivated = dragActivated.current;
    cleanup();
    if (wasActivated) {
      wasDragRef.current = true;
      const
