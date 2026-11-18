"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const LONG_PRESS_MS = 280;
const MOVE_THRESHOLD = 8;
const FLIP_MS = 180;

const INTERACTIVE_SELECTOR =
  "button, a, input, textarea, select, option, [role='button'], [contenteditable='true']";

export function useDragReorder(items, setItems, onReorderEnd) {
  const [draggingId, setDraggingId] = useState(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const itemRefs = useRef(new Map());

  const pointerIdRef = useRef(null);
  const pointerDownIdRef = useRef(null);

  const startPointRef = useRef({ x: 0, y: 0 });
  const grabOffsetRef = useRef({ x: 0, y: 0 });

  const dragStartedRef = useRef(false);
  const cancelledRef = useRef(false);

  const longPressTimerRef = useRef(null);

  const overlayRef = useRef(null);

  const rafRef = useRef(null);
  const pendingPointerRef = useRef(null);

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
    clearTimer();

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    pendingPointerRef.current = null;

    removeOverlay();

    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    dragStartedRef.current = false;
    cancelledRef.current = false;
    pointerIdRef.current = null;
    pointerDownIdRef.current = null;

    setDraggingId(null);
  }, [clearTimer, removeOverlay]);

  /*
   * Create a visual copy of the dragged card.
   *
   * IMPORTANT:
   * The actual card stays in the grid.
   * Only this copy follows the pointer.
   */
  const createOverlay = useCallback((id) => {
    const source = itemRefs.current.get(id);

    if (!source) return null;

    const rect = source.getBoundingClientRect();

    const clone = source.cloneNode(true);

    clone.style.position = "fixed";
    clone.style.left = "0";
    clone.style.top = "0";
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    clone.style.margin = "0";
    clone.style.pointerEvents = "none";

    clone.style.zIndex = "999999";

    clone.style.transformOrigin = "center center";

    clone.style.transform = `translate3d(
      ${rect.left}px,
      ${rect.top}px,
      0
    ) scale(1.035)`;

    clone.style.transition = "none";

    clone.style.boxSizing = "border-box";

    clone.style.opacity = "0.98";

    clone.style.boxShadow =
      "0 18px 45px rgba(63, 47, 36, 0.24)";

    clone.setAttribute("data-drag-overlay", "true");

    document.body.appendChild(clone);

    overlayRef.current = clone;

    // Hide the real card without removing its grid space.
    source.style.visibility = "hidden";

    return {
      rect,
      source,
      clone,
    };
  }, []);

  const moveOverlay = useCallback((x, y) => {
    const overlay = overlayRef.current;

    if (!overlay) return;

    const left =
      x - grabOffsetRef.current.x;

    const top =
      y - grabOffsetRef.current.y;

    overlay.style.transform = `translate3d(
      ${left}px,
      ${top}px,
      0
    ) scale(1.035)`;
  }, []);

  /*
   * Find the card currently underneath the pointer.
   *
   * We deliberately do NOT use "closest card".
   * That caused the old version to reorder while the pointer
   * was merely moving around the grid.
   */
  const findPointerTarget = useCallback(
    (x, y, draggedId) => {
      for (const [id, el] of itemRefs.current.entries()) {
        if (id === draggedId) continue;

        const rect = el.getBoundingClientRect();

        if (
          x >= rect.left &&
          x <= rect.right &&
          y >= rect.top &&
          y <= rect.bottom
        ) {
          return {
            id,
            rect,
          };
        }
      }

      return null;
    },
    []
  );

  /*
   * FLIP animation for every card except the dragged one.
   */
  const animateOthers = useCallback((beforeRects) => {
    for (const [id, el] of itemRefs.current.entries()) {
      if (id === pointerDownIdRef.current) continue;

      const before = beforeRects.get(id);

      if (!before) continue;

      const after = el.getBoundingClientRect();

      const dx = before.left - after.left;
      const dy = before.top - after.top;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        continue;
      }

      el.style.transition = "none";
      el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

      // Force the browser to register the starting position.
      el.getBoundingClientRect();

      requestAnimationFrame(() => {
        el.style.transition =
          `transform ${FLIP_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;

        el.style.transform = "";
      });
    }
  }, []);

  const performReorder = useCallback(
    (targetId) => {
      const draggedId = pointerDownIdRef.current;

      if (!draggedId || !targetId) return;

      const current = itemsRef.current;

      const fromIndex = current.findIndex(
        (item) => item.id === draggedId
      );

      const targetIndex = current.findIndex(
        (item) => item.id === targetId
      );

      if (
        fromIndex === -1 ||
        targetIndex === -1 ||
        fromIndex === targetIndex
      ) {
        return;
      }

      /*
       * Capture the current visual positions BEFORE React changes
       * the order.
       */
      const beforeRects = new Map();

      for (const [id, el] of itemRefs.current.entries()) {
        if (id === draggedId) continue;

        beforeRects.set(id, el.getBoundingClientRect());
      }

      const next = [...current];

      const [moved] = next.splice(fromIndex, 1);

      next.splice(targetIndex, 0, moved);

      setItems(next);

      /*
       * React commits the new grid order.
       * Then FLIP makes the other cards visually travel from
       * their old positions to their new positions.
       */
      requestAnimationFrame(() => {
        animateOthers(beforeRects);
      });
    },
    [animateOthers, setItems]
  );

  const processPointerMove = useCallback(
    (e) => {
      if (!dragStartedRef.current) {
        const dx = e.clientX - startPointRef.current.x;
        const dy = e.clientY - startPointRef.current.y;

        if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
          cancelledRef.current = true;
          clearTimer();
        }

        return;
      }

      e.preventDefault();

      moveOverlay(e.clientX, e.clientY);

      const draggedId = pointerDownIdRef.current;

      if (!draggedId) return;

      const target = findPointerTarget(
        e.clientX,
        e.clientY,
        draggedId
      );

      if (!target) return;

      /*
       * Only reorder when the pointer actually enters another
       * card. No nearest-card calculation.
       */
      performReorder(target.id);
    },
    [
      clearTimer,
      findPointerTarget,
      moveOverlay,
      performReorder,
    ]
  );

  const schedulePointerMove = useCallback(
    (e) => {
      pendingPointerRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        pointerId: e.pointerId,
      };

      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        const p = pendingPointerRef.current;

        if (!p) return;

        processPointerMove({
          ...p,
          preventDefault: () => {},
        });
      });
    },
    [processPointerMove]
  );

  const handlePointerDown = useCallback(
    (id) => (e) => {
      /*
       * Do NOT hijack normal clicks.
       *
       * This is especially important for:
       * Edit
       * Delete
       * Set as cover
       * inputs
       */
      if (e.target.closest(INTERACTIVE_SELECTOR)) {
        return;
      }

      /*
       * Only primary mouse button.
       */
      if (e.pointerType === "mouse" && e.button !== 0) {
        return;
      }

      const element = itemRefs.current.get(id);

      if (!element) return;

      pointerDownIdRef.current = id;
      pointerIdRef.current = e.pointerId;

      startPointRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      const rect = element.getBoundingClientRect();

      grabOffsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      dragStartedRef.current = false;
      cancelledRef.current = false;

      /*
       * Capture the pointer so the drag remains attached to
       * the finger/mouse even when it moves outside the card.
       */
      try {
        element.setPointerCapture(e.pointerId);
      } catch {}

      clearTimer();

      /*
       * Desktop:
       * clicking should remain a click.
       *
       * Touch:
       * require a short hold before drag.
       */
      const delay =
        e.pointerType === "mouse"
          ? 120
          : LONG_PRESS_MS;

      longPressTimerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;

        dragStartedRef.current = true;

        setDraggingId(id);

        if (navigator.vibrate) {
          navigator.vibrate(10);
        }

        createOverlay(id);
      }, delay);
    },
    [clearTimer, createOverlay]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      if (!dragStartedRef.current) {
        const dx = e.clientX - startPointRef.current.x;
        const dy = e.clientY - startPointRef.current.y;

        if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
          cancelledRef.current = true;
          clearTimer();
        }

        return;
      }

      e.preventDefault();

      schedulePointerMove(e);
    },
    [clearTimer, schedulePointerMove]
  );

  const handlePointerUp = useCallback(
    async (e) => {
      if (
        pointerIdRef.current !== null &&
        e.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      clearTimer();

      const wasDragging = dragStartedRef.current;
      const draggedId = pointerDownIdRef.current;

      if (!wasDragging) {
        cleanup();
        return;
      }

      wasDragRef.current = true;

      const source = draggedId
        ? itemRefs.current.get(draggedId)
        : null;

      /*
       * Reveal the original card.
       * It remains in its final React grid position.
       */
      if (source) {
        source.style.visibility = "";
      }

      /*
       * Remove overlay immediately.
       *
       * No "settling" transform is required because the overlay
       * was never part of the grid.
       */
      removeOverlay();

      dragStartedRef.current = false;

      setDraggingId(null);

      pointerDownIdRef.current = null;
      pointerIdRef.current = null;

      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";

      const orderedIds =
        itemsRef.current.map((item) => item.id);

      try {
        await onReorderEnd(orderedIds);
      } catch (error) {
        console.error("Failed to save reorder:", error);
      }
    },
    [
      cleanup,
      clearTimer,
      onReorderEnd,
      removeOverlay,
    ]
  );

  useEffect(() => {
    const onWindowPointerMove = (e) => {
      handlePointerMove(e);
    };

    const onWindowPointerUp = (e) => {
      handlePointerUp(e);
    };

    window.addEventListener(
      "pointermove",
      onWindowPointerMove,
      { passive: false }
    );

    window.addEventListener(
      "pointerup",
      onWindowPointerUp
    );

    window.addEventListener(
      "pointercancel",
      onWindowPointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        onWindowPointerMove
      );

      window.removeEventListener(
        "pointerup",
        onWindowPointerUp
      );

      window.removeEventListener(
        "pointercancel",
        onWindowPointerUp
      );

      cleanup();
    };
  }, [cleanup, handlePointerMove, handlePointerUp]);

  /*
   * Keep the actual cards completely free from React-driven
   * transform styles.
   */
  useEffect(() => {
    for (const [id, el] of itemRefs.current.entries()) {
      if (id === draggingId) continue;

      el.style.transform = "";
      el.style.transition = "";
      el.style.visibility = "";
    }
  }, [items, draggingId]);

  return {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  };
}
