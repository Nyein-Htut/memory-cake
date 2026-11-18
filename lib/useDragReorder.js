"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 180;
const MOVE_CANCEL_DISTANCE = 8;
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

  const startXRef = useRef(0);
  const startYRef = useRef(0);

  const grabXRef = useRef(0);
  const grabYRef = useRef(0);

  const dragStartedRef = useRef(false);
  const cancelledRef = useRef(false);

  const longPressTimerRef = useRef(null);

  const overlayRef = useRef(null);

  const lastTargetRef = useRef(null);

  const wasDragRef = useRef(false);

  const registerItemRef = useCallback((id) => {
    return (el) => {
      if (el) {
        itemRefs.current.set(id, el);
      } else {
        itemRefs.current.delete(id);
      }
    };
  }, []);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const removeOverlay = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    clearLongPress();
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

    dragStartedRef.current = false;
    cancelledRef.current = false;

    lastTargetRef.current = null;

    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    setDraggingId(null);
  }, [clearLongPress, removeOverlay]);

  /*
   * Create the floating card.
   */
  const createOverlay = useCallback(
    (id, clientX, clientY) => {
      const source = itemRefs.current.get(id);

      if (!source) return false;

      const rect = source.getBoundingClientRect();

      grabXRef.current = clientX - rect.left;
      grabYRef.current = clientY - rect.top;

      const clone = source.cloneNode(true);

      clone.style.position = "fixed";
      clone.style.left = "0";
      clone.style.top = "0";

      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;

      clone.style.margin = "0";

      clone.style.pointerEvents = "none";
      clone.style.zIndex = "999999";

      clone.style.boxSizing = "border-box";

      clone.style.transformOrigin = "center center";

      clone.style.transition = "none";

      clone.style.boxShadow =
        "0 18px 40px rgba(63, 47, 36, 0.25)";

      clone.style.transform =
        `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1.03)`;

      document.body.appendChild(clone);

      overlayRef.current = clone;

      /*
       * Keep the original card in the grid.
       * Only make it invisible.
       */
      source.style.visibility = "hidden";

      dragStartedRef.current = true;

      setDraggingId(id);

      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      return true;
    },
    []
  );

  /*
   * Move the floating card.
   *
   * IMPORTANT:
   * There is NO layout measurement here.
   */
  const moveOverlay = useCallback((x, y) => {
    const overlay = overlayRef.current;

    if (!overlay) return;

    const left = x - grabXRef.current;
    const top = y - grabYRef.current;

    overlay.style.transform =
      `translate3d(${left}px, ${top}px, 0) scale(1.03)`;
  }, []);

  /*
   * Find the card directly underneath the pointer.
   */
  const findTarget = useCallback((x, y) => {
    const draggedId = activeIdRef.current;

    for (const [id, el] of itemRefs.current.entries()) {
      if (id === draggedId) continue;

      const rect = el.getBoundingClientRect();

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return id;
      }
    }

    return null;
  }, []);

  /*
   * Reorder React state and animate the other cards.
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
       * Save current positions.
       */
      const beforeRects = new Map();

      for (const [id, el] of itemRefs.current.entries()) {
        if (id !== draggedId) {
          beforeRects.set(
            id,
            el.getBoundingClientRect()
          );
        }
      }

      /*
       * Change the order.
       */
      const next = [...current];

      const [moved] = next.splice(fromIndex, 1);

      next.splice(toIndex, 0, moved);

      lastTargetRef.current = targetId;

      setItems(next);

      /*
       * Animate the cards from their old positions.
       */
      requestAnimationFrame(() => {
        for (const [id, el] of itemRefs.current.entries()) {
          if (id === draggedId) continue;

          const before = beforeRects.get(id);

          if (!before) continue;

          const after = el.getBoundingClientRect();

          const dx = before.left - after.left;
          const dy = before.top - after.top;

          if (
            Math.abs(dx) < 0.5 &&
            Math.abs(dy) < 0.5
          ) {
            continue;
          }

          el.style.transition = "none";

          el.style.transform =
            `translate3d(${dx}px, ${dy}px, 0)`;

          /*
           * Force the starting position.
           */
          el.offsetHeight;

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
       * Don't steal clicks from buttons / inputs / links.
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

      clearLongPress();

      activeIdRef.current = id;
      pointerIdRef.current = e.pointerId;

      startXRef.current = e.clientX;
      startYRef.current = e.clientY;

      cancelledRef.current = false;
      dragStartedRef.current = false;

      lastTargetRef.current = null;

      /*
       * Mouse:
       * start immediately.
       */
      if (e.pointerType === "mouse") {
  createOverlay(
    id,
    e.clientX,
    e.clientY
  );

  return;
}

/*
 * On touch:
 * don't immediately block scrolling.
 *
 * A long press starts dragging.
 * Normal vertical movement remains available for scrolling.
 */
longPressTimerRef.current = setTimeout(() => {
  if (cancelledRef.current) return;

  createOverlay(
    id,
    startXRef.current,
    startYRef.current
  );
}, LONG_PRESS_MS);
    },
    [clearLongPress, createOverlay]
  );

  /*
   * Pointer move.
   */
  useEffect(() => {
    const handleMove = (e) => {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      /*
       * Before drag starts:
       * movement cancels the touch hold.
       */
      if (!dragStartedRef.current) {
        const dx =
          e.clientX - startXRef.current;

        const dy =
          e.clientY - startYRef.current;

        if (
          Math.hypot(dx, dy) >
          MOVE_CANCEL_DISTANCE
        ) {
          cancelledRef.current = true;
          clearLongPress();
        }

        return;
      }

      e.preventDefault();

      moveOverlay(
        e.clientX,
        e.clientY
      );

      const target = findTarget(
        e.clientX,
        e.clientY
      );

      if (target) {
        reorder(target);
      }
    };

    const handleUp = async (e) => {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      clearLongPress();

      if (!dragStartedRef.current) {
        cleanup();
        return;
      }

      wasDragRef.current = true;

      const draggedId =
        activeIdRef.current;

      /*
       * Reveal the real card.
       */
      if (draggedId !== null) {
        const el =
          itemRefs.current.get(draggedId);

        if (el) {
          el.style.visibility = "";
        }
      }

      /*
       * Remove floating card.
       */
      removeOverlay();

      const orderedIds =
        itemsRef.current.map(
          (item) => item.id
        );

      activeIdRef.current = null;
      pointerIdRef.current = null;

      dragStartedRef.current = false;
      cancelledRef.current = false;

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
    };

    window.addEventListener(
      "pointermove",
      handleMove,
      { passive: false }
    );

    window.addEventListener(
      "pointerup",
      handleUp
    );

    window.addEventListener(
      "pointercancel",
      handleUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handleMove
      );

      window.removeEventListener(
        "pointerup",
        handleUp
      );

      window.removeEventListener(
        "pointercancel",
        handleUp
      );
    };
  }, [
    cleanup,
    clearLongPress,
    findTarget,
    moveOverlay,
    onReorderEnd,
    removeOverlay,
    reorder,
  ]);

  /*
   * Clean up if the component disappears.
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  };
}
