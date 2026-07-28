"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// Touch-friendly drag-to-reorder, built on the Pointer Events API instead of
// the HTML5 Drag and Drop API. HTML5 drag-and-drop only really works with a
// mouse — most mobile browsers (iOS Safari especially) don't fire those
// events for touch, which is why dragging didn't work on phones. Pointer
// events fire consistently for touch, mouse, and stylus, so this works
// everywhere.
//
// Usage:
//   const { draggingId, overId, handlePointerDown, registerItemRef } =
//     useDragReorder(items, setItems, async (orderedIds) => {
//       await fetch(...)  // persist the new order
//     });
//
// Then on each item's wrapper element:  ref={registerItemRef(item.id)}
// And on the small drag-handle element inside it: onPointerDown={handlePointerDown(item.id)}
export function useDragReorder(items, setItems, onReorderEnd) {
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);

  // Refs (not state) so the window-level event listeners always see the
  // latest values without needing to be re-attached on every render.
  const draggingIdRef = useRef(null);
  const itemsRef = useRef(items);
  const itemRefs = useRef(new Map());

  itemsRef.current = items;

  const registerItemRef = useCallback(
    (id) => (el) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    },
    []
  );

  // Finds whichever item's center is closest to the current finger/pointer
  // position — this is what lets reordering work in a multi-column grid,
  // not just a single vertical list.
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

  const handlePointerMoveRef = useRef();
  const handlePointerUpRef = useRef();

  const endDrag = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMoveRef.current);
    window.removeEventListener("pointerup", handlePointerUpRef.current);
    document.body.style.touchAction = "";
    document.body.style.userSelect = "";

    const wasDragging = draggingIdRef.current !== null;
    draggingIdRef.current = null;
    setDraggingId(null);
    setOverId(null);

    if (wasDragging) {
      const orderedIds = itemsRef.current.map((it) => it.id);
      onReorderEnd(orderedIds);
    }
  }, [onReorderEnd]);

  handlePointerMoveRef.current = (e) => {
    if (draggingIdRef.current === null) return;
    e.preventDefault(); // stop the page from scrolling mid-drag on touch

    const targetId = findClosestId(e.clientX, e.clientY, draggingIdRef.current);
    if (targetId === null) return;

    setOverId(targetId);

    const current = itemsRef.current;
    const fromIndex = current.findIndex((it) => it.id === draggingIdRef.current);
    const toIndex = current.findIndex((it) => it.id === targetId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const next = [...current];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
  };

  handlePointerUpRef.current = () => endDrag();

  const handlePointerDown = useCallback(
    (id) => (e) => {
      e.preventDefault();
      draggingIdRef.current = id;
      setDraggingId(id);

      // Lock page scroll + text selection while dragging, so a finger drag
      // moves the card instead of scrolling the page underneath it.
      document.body.style.touchAction = "none";
      document.body.style.userSelect = "none";

      window.addEventListener("pointermove", handlePointerMoveRef.current, {
        passive: false,
      });
      window.addEventListener("pointerup", handlePointerUpRef.current);
    },
    []
  );

  // Safety cleanup if the component unmounts mid-drag.
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMoveRef.current);
      window.removeEventListener("pointerup", handlePointerUpRef.current);
      document.body.style.touchAction = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return { draggingId, overId, handlePointerDown, registerItemRef };
}
