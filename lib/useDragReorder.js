"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";

const LONG_PRESS_MS = 220;
const MOVE_CANCEL_THRESHOLD = 8;
const SETTLE_MS = 220;

function isInteractiveElement(target) {
  if (!(target instanceof Element)) return false;

  return !!target.closest(
    "button, a, input, textarea, select, option, [role='button'], [contenteditable='true']"
  );
}

export function useDragReorder(items, setItems, onReorderEnd) {
  const [draggingId, setDraggingId] = useState(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const itemRefs = useRef(new Map());

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

  const pointerIdRef = useRef(null);
  const draggedIdRef = useRef(null);

  const startPointerRef = useRef({ x: 0, y: 0 });

  /*
   * The card's ORIGINAL position at the moment dragging begins.
   * This never changes during the drag.
   */
  const startRectRef = useRef(null);

  /*
   * Where inside the card the finger grabbed it.
   */
  const grabOffsetRef = useRef({ x: 0, y: 0 });

  const lastPointerRef = useRef({ x: 0, y: 0 });

  const longPressTimerRef = useRef(null);

  const dragActivatedRef = useRef(false);

  const previousRectsRef = useRef(null);

  const wasDragRef = useRef(false);

  const rafRef = useRef(null);

  const moveHandlerRef = useRef(null);
  const upHandlerRef = useRef(null);

  /*
   * ------------------------------------------------------------------
   * Move the dragged card directly from the pointer position.
   *
   * IMPORTANT:
   * We never call getBoundingClientRect() here.
   * We never calculate a new position from an already-transformed card.
   *
   * This is what prevents the shaking/jitter.
   * ------------------------------------------------------------------
   */
  const updateDraggedVisual = useCallback(() => {
    if (!dragActivatedRef.current) return;

    const id = draggedIdRef.current;

    if (!id) return;

    const el = itemRefs.current.get(id);

    if (!el) return;

    const startRect = startRectRef.current;

    if (!startRect) return;

    const pointer = lastPointerRef.current;
    const grab = grabOffsetRef.current;

    const x =
      pointer.x -
      grab.x -
      startRect.left;

    const y =
      pointer.y -
      grab.y -
      startRect.top;

    el.style.transform =
      `translate3d(${x}px, ${y}px, 0) scale(1.035)`;
  }, []);

  /*
   * Schedule movement once per animation frame.
   * This prevents a flood of transform writes on fast touch devices.
   */
  const scheduleDraggedVisual = useCallback(() => {
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      updateDraggedVisual();
    });
  }, [updateDraggedVisual]);

  /*
   * Get the CURRENT visual positions of all OTHER cards.
   *
   * The dragged card is deliberately excluded.
   */
  const findTarget = useCallback(
    (clientX, clientY) => {
      const draggedId = draggedIdRef.current;

      if (!draggedId) return null;

      let bestId = null;
      let bestDistance = Infinity;

      for (const [id, el] of itemRefs.current.entries()) {
        if (id === draggedId) continue;

        const rect = el.getBoundingClientRect();

        /*
         * Only consider cards whose actual rectangle contains the
         * pointer.
         *
         * This is much more stable than "nearest card".
         */
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          continue;
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distance =
          (clientX - centerX) ** 2 +
          (clientY - centerY) ** 2;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestId = id;
        }
      }

      return bestId;
    },
    []
  );

  /*
   * Animate cards that changed position after React reorders them.
   */
  useLayoutEffect(() => {
    const previous = previousRectsRef.current;

    if (!previous) return;

    previousRectsRef.current = null;

    for (const [id, el] of itemRefs.current.entries()) {
      if (id === draggedIdRef.current) continue;

      const before = previous.get(id);

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

      el.getBoundingClientRect();

      requestAnimationFrame(() => {
        el.style.transition =
          `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;

        el.style.transform = "";
      });
    }

    /*
     * React has moved the dragged item's DOM position.
     * Put the dragged card back underneath the finger using
     * the ORIGINAL drag-start rectangle.
     */
    scheduleDraggedVisual();
  }, [items, scheduleDraggedVisual]);

  const clearListeners = useCallback(() => {
    if (moveHandlerRef.current) {
      window.removeEventListener(
        "pointermove",
        moveHandlerRef.current
      );
    }

    if (upHandlerRef.current) {
      window.removeEventListener(
        "pointerup",
        upHandlerRef.current
      );
    }

    clearTimeout(longPressTimerRef.current);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    document.body.style.userSelect = "";
    document.body.style.touchAction = "";

    moveHandlerRef.current = null;
    upHandlerRef.current = null;
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      lastPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      /*
       * Before dragging begins:
       * allow normal scrolling/tapping.
       */
      if (!dragActivatedRef.current) {
        const dx =
          e.clientX - startPointerRef.current.x;

        const dy =
          e.clientY - startPointerRef.current.y;

        if (
          Math.hypot(dx, dy) >
          MOVE_CANCEL_THRESHOLD
        ) {
          clearListeners();
          draggedIdRef.current = null;
        }

        return;
      }

      e.preventDefault();

      /*
       * Move the card immediately.
       */
      scheduleDraggedVisual();

      const targetId = findTarget(
        e.clientX,
        e.clientY
      );

      if (!targetId) return;

      const draggedId = draggedIdRef.current;

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
       * Capture positions BEFORE changing the array.
       */
      const rects = new Map();

      for (const [id, el] of itemRefs.current.entries()) {
        if (id === draggedId) continue;

        rects.set(
          id,
          el.getBoundingClientRect()
        );
      }

      previousRectsRef.current = rects;

      const next = [...current];

      const [moved] = next.splice(
        fromIndex,
        1
      );

      next.splice(
        toIndex,
        0,
        moved
      );

      setItems(next);
    },
    [
      clearListeners,
      findTarget,
      scheduleDraggedVisual,
    ]
  );

  const handlePointerUp = useCallback(async () => {
    clearListeners();

    const wasDragging =
      dragActivatedRef.current;

    const draggedId =
      draggedIdRef.current;

    dragActivatedRef.current = false;
    draggedIdRef.current = null;

    setDraggingId(null);

    if (!wasDragging) {
      return;
    }

    wasDragRef.current = true;

    const el = itemRefs.current.get(
      draggedId
    );

    if (el) {
      /*
       * Capture where the card visually is.
       */
      const visualRect =
        el.getBoundingClientRect();

      /*
       * Remove the drag transform.
       */
      el.style.transition = "none";
      el.style.transform = "";

      /*
       * The browser now gives us the true
       * resting position.
       */
      const restingRect =
        el.getBoundingClientRect();

      const dx =
        visualRect.left -
        restingRect.left;

      const dy =
        visualRect.top -
        restingRect.top;

      /*
       * Start from the visual position...
       */
      el.style.transform =
        `translate3d(${dx}px, ${dy}px, 0) scale(1.035)`;

      el.getBoundingClientRect();

      /*
       * ...then smoothly settle into its final slot.
       */
      requestAnimationFrame(() => {
        el.style.transition =
          `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), ` +
          `box-shadow ${SETTLE_MS}ms ease`;

        el.style.transform = "";
        el.style.boxShadow = "";
        el.style.zIndex = "";
        el.style.willChange = "";
      });
    }

    const orderedIds =
      itemsRef.current.map(
        (item) => item.id
      );

    await onReorderEnd(orderedIds);
  }, [clearListeners, onReorderEnd]);

  moveHandlerRef.current =
    handlePointerMove;

  upHandlerRef.current =
    handlePointerUp;

  const handlePointerDown = useCallback(
    (id) => (e) => {
      /*
       * Do NOT start dragging when the user
       * touches an interactive control.
       */
      if (
        isInteractiveElement(e.target)
      ) {
        return;
      }

      /*
       * Only left-click starts a desktop drag.
       */
      if (
        e.pointerType === "mouse" &&
        e.button !== 0
      ) {
        return;
      }

      const el =
        itemRefs.current.get(id);

      if (!el) return;

      pointerIdRef.current =
        e.pointerId;

      draggedIdRef.current = id;

      startPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      lastPointerRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      /*
       * Capture the card's REAL position exactly once.
       */
      startRectRef.current =
        el.getBoundingClientRect();

      grabOffsetRef.current = {
        x:
          e.clientX -
          startRectRef.current.left,

        y:
          e.clientY -
          startRectRef.current.top,
      };

      dragActivatedRef.current = false;

      wasDragRef.current = false;

      /*
       * Pointer capture helps prevent the
       * drag from breaking when the finger
       * moves quickly.
       */
      try {
        el.setPointerCapture(
          e.pointerId
        );
      } catch {
        // Ignore unsupported browsers.
      }

      clearTimeout(
        longPressTimerRef.current
      );

      longPressTimerRef.current =
        setTimeout(() => {
          if (
            draggedIdRef.current !== id
          ) {
            return;
          }

          dragActivatedRef.current =
            true;

          setDraggingId(id);

          document.body.style.userSelect =
            "none";

          document.body.style.touchAction =
            "none";

          if (
            navigator.vibrate
          ) {
            navigator.vibrate(8);
          }

          el.style.transition =
            "transform 100ms ease, box-shadow 100ms ease";

          el.style.boxShadow =
            "0 16px 34px rgba(63, 47, 36, 0.24)";

          el.style.zIndex = "50";

          el.style.willChange =
            "transform";

          /*
           * Initial position directly under
           * the finger.
           */
          updateDraggedVisual();
        }, LONG_PRESS_MS);

      window.addEventListener(
        "pointermove",
        moveHandlerRef.current,
        { passive: false }
      );

      window.addEventListener(
        "pointerup",
        upHandlerRef.current
      );
    },
    [
      clearListeners,
      updateDraggedVisual,
    ]
  );

  useEffect(() => {
    return () => {
      clearListeners();

      const id =
        draggedIdRef.current;

      if (!id) return;

      const el =
        itemRefs.current.get(id);

      if (!el) return;

      el.style.transform = "";
      el.style.transition = "";
      el.style.boxShadow = "";
      el.style.zIndex = "";
      el.style.willChange = "";
    };
  }, [clearListeners]);

  return {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  };
}
