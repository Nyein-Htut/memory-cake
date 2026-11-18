"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 220;
const MOVE_THRESHOLD = 6;
const FLIP_DURATION = 180;

const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, option, [role='button'], [contenteditable='true']";

export function useDragReorder(items, setItems, onReorderEnd) {
  const [draggingId, setDraggingId] = useState(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const itemRefs = useRef(new Map());

  const activeIdRef = useRef(null);
  const pointerIdRef = useRef(null);

  const startPointRef = useRef({ x: 0, y: 0 });
  const grabOffsetRef = useRef({ x: 0, y: 0 });

  const timerRef = useRef(null);

  const overlayRef = useRef(null);

  const draggingRef = useRef(false);
  const cancelledRef = useRef(false);

  const lastTargetRef = useRef(null);

  const wasDragRef = useRef(false);

  const registerItemRef = useCallback(
    (id) => (el) => {
      if (el) {
        itemRefs.current.set(id, el);
      } else {
        itemRefs.current.delete(id);
      }
    },
    []
  );

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const removeOverlay = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    removeOverlay();

    const id = activeIdRef.current;
    if (id !== null) {
      const el = itemRefs.current.get(id);

      if (el) {
        el.style.visibility = "";
      }
    }

    activeIdRef.current = null;
    pointerIdRef.current = null;
    draggingRef.current = false;
    cancelledRef.current = false;
    lastTargetRef.current = null;

    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    setDraggingId(null);
  }, [clearTimer, removeOverlay]);

  /*
   * Make a fixed copy of the card.
   * The real card remains in the grid and keeps its space.
   */
  const startDragging = useCallback(
    (id, clientX, clientY) => {
      const source = itemRefs.current.get(id);

      if (!source) return;

      const rect = source.getBoundingClientRect();

      const overlay = source.cloneNode(true);

      overlay.style.position = "fixed";
      overlay.style.left = "0px";
      overlay.style.top = "0px";
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      overlay.style.margin = "0";
      overlay.style.pointerEvents = "none";
      overlay.style.zIndex = "999999";

      overlay.style.boxSizing = "border-box";
      overlay.style.transformOrigin = "center center";

      overlay.style.transition = "none";

      overlay.style.transform =
        `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1.03)`;

      overlay.style.boxShadow =
        "0 18px 40px rgba(63, 47, 36, 0.25)";

      document.body.appendChild(overlay);

      overlayRef.current = overlay;

      source.style.visibility = "hidden";

      activeIdRef.current = id;
      draggingRef.current = true;

      setDraggingId(id);

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      moveOverlay(clientX, clientY);
    },
    []
  );

  /*
   * Move ONLY the fixed overlay.
   * No getBoundingClientRect() here.
   */
  const moveOverlay = (clientX, clientY) => {
    const overlay = overlayRef.current;

    if (!overlay) return;

    const left =
      clientX - grabOffsetRef.current.x;

    const top =
      clientY - grabOffsetRef.current.y;

    overlay.style.transform =
      `translate3d(${left}px, ${top}px, 0) scale(1.03)`;
  };

  /*
   * Return the card that the pointer is actually over.
   */
  const getTarget = (clientX, clientY) => {
    const activeId = activeIdRef.current;

    for (const [id, el] of itemRefs.current.entries()) {
      if (id === activeId) continue;

      const rect = el.getBoundingClientRect();

      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return id;
      }
    }

    return null;
  };

  /*
   * Animate the cards around the dragged card.
   */
  const reorder = useCallback(
    (targetId) => {
      const draggedId = activeIdRef.current;

      if (!draggedId || !targetId) return;

      if (lastTargetRef.current === targetId) {
        return;
      }

      const current = itemsRef.current;

      const fromIndex = current.findIndex(
        (item) => item.id === draggedId
      );

      const toIndex = current.findIndex(
        (item) => item.id === targetId
      );

      if (
        fromIndex === -1 ||
        toIndex === -1 ||
        fromIndex === toIndex
      ) {
        return;
      }

      /*
       * Capture positions before changing React state.
       */
      const before = new Map();

      for (const [id, el] of itemRefs.current.entries()) {
        if (id === draggedId) continue;

        before.set(id, el.getBoundingClientRect());
      }

      const next = [...current];

      const [moved] = next.splice(fromIndex, 1);

      next.splice(toIndex, 0, moved);

      lastTargetRef.current = targetId;

      setItems(next);

      /*
       * Wait for React to update the grid,
       * then FLIP the other cards.
       */
      requestAnimationFrame(() => {
        for (const [id, el] of itemRefs.current.entries()) {
          if (id === draggedId) continue;

          const oldRect = before.get(id);

          if (!oldRect) continue;

          const newRect = el.getBoundingClientRect();

          const dx = oldRect.left - newRect.left;
          const dy = oldRect.top - newRect.top;

          if (
            Math.abs(dx) < 0.5 &&
            Math.abs(dy) < 0.5
          ) {
            continue;
          }

          el.style.transition = "none";

          el.style.transform =
            `translate3d(${dx}px, ${dy}px, 0)`;

          requestAnimationFrame(() => {
            el.style.transition =
              `transform ${FLIP_DURATION}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;

            el.style.transform = "";
          });
        }
      });
    },
    [setItems]
  );

  /*
   * Pointer down.
   */
  const handlePointerDown = useCallback(
    (id) => (e) => {
      /*
       * Never start dragging when interacting with controls.
       */
      if (e.target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      /*
       * Only left mouse button.
       */
      if (
        e.pointerType === "mouse" &&
        e.button !== 0
      ) {
        return;
      }

      const el = itemRefs.current.get(id);

      if (!el) return;

      clearTimer();

      activeIdRef.current = id;
      pointerIdRef.current = e.pointerId;

      startPointRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      const rect = el.getBoundingClientRect();

      grabOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      draggingRef.current = false;
      cancelledRef.current = false;
      lastTargetRef.current = null;

      /*
       * Capture the pointer.
       */
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}

      /*
       * Desktop:
       * start as soon as the mouse moves.
       *
       * Touch:
       * require a short hold.
       */
      if (e.pointerType === "mouse") {
        startDragging(id, e.clientX, e.clientY);
      } else {
        timerRef.current = setTimeout(() => {
          if (cancelledRef.current) return;

          startDragging(
            id,
            startPointRef.current.x,
            startPointRef.current.y
          );
        }, LONG_PRESS_MS);
      }
    },
    [clearTimer, startDragging]
  );

  /*
   * Pointer move.
   */
  const handlePointerMove = useCallback(
    (e) => {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      /*
       * Before dragging:
       * movement cancels a touch long-press.
       */
      if (!draggingRef.current) {
        const dx =
          e.clientX - startPointRef.current.x;

        const dy =
          e.clientY - startPointRef.current.y;

        if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
          cancelledRef.current = true;
          clearTimer();
        }

        return;
      }

      e.preventDefault();

      /*
       * Move the overlay directly.
       */
      moveOverlay(e.clientX, e.clientY);

      /*
       * See what card is underneath the pointer.
       */
      const target = getTarget(
        e.clientX,
        e.clientY
      );

      if (target) {
        reorder(target);
      }
    },
    [clearTimer, reorder]
  );

  /*
   * Pointer up.
   */
  const handlePointerUp = useCallback(
    async (e) => {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      clearTimer();

      const wasDragging = draggingRef.current;

      if (!wasDragging) {
        reset();
        return;
      }

      wasDragRef.current = true;

      const orderedIds =
        itemsRef.current.map(
          (item) => item.id
        );

      /*
       * Reveal the real card.
       */
      const id = activeIdRef.current;

      if (id !== null) {
        const el = itemRefs.current.get(id);

        if (el) {
          el.style.visibility = "";
        }
      }

      /*
       * Remove floating copy.
       */
      removeOverlay();

      draggingRef.current = false;

      activeIdRef.current = null;
      pointerIdRef.current = null;
      lastTargetRef.current = null;

      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";

      setDraggingId(null);

      try {
        await onReorderEnd(orderedIds);
      } catch (error) {
        console.error(
          "Failed to save photo order:",
          error
        );
      }
    },
    [
      clearTimer,
      onReorderEnd,
      removeOverlay,
      reset,
    ]
  );

  useEffect(() => {
    const move = (e) => handlePointerMove(e);
    const up = (e) => handlePointerUp(e);

    window.addEventListener(
      "pointermove",
      move,
      { passive: false }
    );

    window.addEventListener(
      "pointerup",
      up
    );

    window.addEventListener(
      "pointercancel",
      up
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move
      );

      window.removeEventListener(
        "pointerup",
        up
      );

      window.removeEventListener(
        "pointercancel",
        up
      );

      reset();
    };
  }, [
    handlePointerMove,
    handlePointerUp,
    reset,
  ]);

  return {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  };
}
