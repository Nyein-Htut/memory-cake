"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";

const LONG_PRESS_MS = 260;
const MOVE_CANCEL_THRESHOLD = 8;
const REORDER_THRESHOLD = 0.45;
const SETTLE_MS = 220;

function isInteractiveElement(target) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      "button, a, input, textarea, select, option, [role='button'], [contenteditable='true']"
    )
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

  const pointerDownId = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const grabOffset = useRef({ x: 0, y: 0 });

  const longPressTimer = useRef(null);
  const dragActivated = useRef(false);

  const previousRects = useRef(null);

  const wasDragRef = useRef(false);

  const pointerMoveHandler = useRef(null);
  const pointerUpHandler = useRef(null);

  /*
   * Find the item that the pointer is actually crossing.
   *
   * IMPORTANT:
   * We do NOT simply choose the nearest card.
   * That was causing cards to reorder while the cursor was merely
   * moving around nearby cards.
   */
  const findReorderTarget = useCallback(
    (clientX, clientY, draggedId) => {
      const draggedEl = itemRefs.current.get(draggedId);

      for (const [id, el] of itemRefs.current.entries()) {
        if (id === draggedId) continue;

        const rect = el.getBoundingClientRect();

        const inside =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;

        if (!inside) continue;

        /*
         * Only reorder after the pointer has crossed roughly the middle
         * of the target card.
         *
         * This prevents tiny movements near the edge from constantly
         * swapping cards.
         */
        const horizontalProgress =
          rect.width > 0
            ? (clientX - rect.left) / rect.width
            : 0;

        const verticalProgress =
          rect.height > 0
            ? (clientY - rect.top) / rect.height
            : 0;

        /*
         * Determine whether this is primarily a horizontal or vertical
         * movement based on the dragged card's position.
         */
        if (draggedEl) {
          const draggedRect = draggedEl.getBoundingClientRect();

          const dx = clientX - (draggedRect.left + draggedRect.width / 2);
          const dy = clientY - (draggedRect.top + draggedRect.height / 2);

          if (Math.abs(dx) > Math.abs(dy)) {
            if (
              horizontalProgress > REORDER_THRESHOLD ||
              horizontalProgress < 1 - REORDER_THRESHOLD
            ) {
              return id;
            }
          } else {
            if (
              verticalProgress > REORDER_THRESHOLD ||
              verticalProgress < 1 - REORDER_THRESHOLD
            ) {
              return id;
            }
          }
        }

        return id;
      }

      return null;
    },
    []
  );

  /*
   * Keep the dragged card under the pointer.
   *
   * We calculate its current natural position and apply only the
   * necessary transform. This is much more stable than repeatedly
   * clearing/reapplying transforms.
   */
  const updateDraggedPosition = useCallback(() => {
    const id = pointerDownId.current;

    if (!id) return;

    const el = itemRefs.current.get(id);

    if (!el) return;

    const rect = el.getBoundingClientRect();

    const x =
      lastPointer.current.x -
      grabOffset.current.x -
      rect.left;

    const y =
      lastPointer.current.y -
      grabOffset.current.y -
      rect.top;

    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.035)`;
  }, []);

  /*
   * FLIP animation for cards displaced by a reorder.
   */
  useLayoutEffect(() => {
    if (!previousRects.current) return;

    const beforeRects = previousRects.current;
    previousRects.current = null;

    for (const [id, el] of itemRefs.current.entries()) {
      if (id === pointerDownId.current) continue;

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

      el.getBoundingClientRect();

      requestAnimationFrame(() => {
        el.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        el.style.transform = "";
      });
    }

    if (dragActivated.current) {
      requestAnimationFrame(() => {
        updateDraggedPosition();
      });
    }
  }, [items, updateDraggedPosition]);

  const clearListeners = useCallback(() => {
    if (pointerMoveHandler.current) {
      window.removeEventListener(
        "pointermove",
        pointerMoveHandler.current
      );
    }

    if (pointerUpHandler.current) {
      window.removeEventListener(
        "pointerup",
        pointerUpHandler.current
      );
    }

    clearTimeout(longPressTimer.current);

    document.body.style.userSelect = "";
    document.body.style.touchAction = "";

    pointerMoveHandler.current = null;
    pointerUpHandler.current = null;
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      lastPointer.current = {
        x: e.clientX,
        y: e.clientY,
      };

      /*
       * Before drag activation:
       *
       * If the user moves their finger/mouse too much, cancel the
       * long press. This allows normal scrolling on mobile.
       */
      if (!dragActivated.current) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;

        if (Math.hypot(dx, dy) > MOVE_CANCEL_THRESHOLD) {
          clearListeners();
          pointerDownId.current = null;
        }

        return;
      }

      e.preventDefault();

      updateDraggedPosition();

      const draggedId = pointerDownId.current;

      if (!draggedId) return;

      const targetId = findReorderTarget(
        e.clientX,
        e.clientY,
        draggedId
      );

      if (!targetId) return;

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
       * Capture the positions BEFORE React changes the order.
       */
      const rects = new Map();

      for (const [id, el] of itemRefs.current.entries()) {
        rects.set(id, el.getBoundingClientRect());
      }

      previousRects.current = rects;

      const next = [...current];

      const [moved] = next.splice(fromIndex, 1);

      next.splice(toIndex, 0, moved);

      setItems(next);
    },
    [
      clearListeners,
      findReorderTarget,
      updateDraggedPosition,
    ]
  );

  const handlePointerUp = useCallback(() => {
    clearListeners();

    const wasActivated = dragActivated.current;
    const draggedId = pointerDownId.current;

    dragActivated.current = false;
    pointerDownId.current = null;

    setDraggingId(null);

    if (!wasActivated) {
      return;
    }

    wasDragRef.current = true;

    const el = itemRefs.current.get(draggedId);

    if (el) {
      const before = el.getBoundingClientRect();

      el.style.transition = "none";
      el.style.transform = "none";

      const after = el.getBoundingClientRect();

      const dx = before.left - after.left;
      const dy = before.top - after.top;

      el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.035)`;

      el.getBoundingClientRect();

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

    const orderedIds = itemsRef.current.map(
      (item) => item.id
    );

    onReorderEnd(orderedIds);
  }, [clearListeners, onReorderEnd]);

  pointerMoveHandler.current = handlePointerMove;
  pointerUpHandler.current = handlePointerUp;

  const handlePointerDown = useCallback(
    (id) => (e) => {
      /*
       * VERY IMPORTANT:
       *
       * Clicking Edit / Delete / Set as cover / inputs etc.
       * must NEVER start a drag.
       */
      if (isInteractiveElement(e.target)) {
        return;
      }

      /*
       * Only primary mouse button starts dragging.
       * Touch and pen are allowed.
       */
      if (
        e.pointerType === "mouse" &&
        e.button !== 0
      ) {
        return;
      }

      pointerDownId.current = id;

      startPos.current = {
        x: e.clientX,
        y: e.clientY,
      };

      lastPointer.current = {
        x: e.clientX,
        y: e.clientY,
      };

      dragActivated.current = false;

      wasDragRef.current = false;

      const el = itemRefs.current.get(id);

      if (el) {
        const rect = el.getBoundingClientRect();

        grabOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        /*
         * Pointer capture makes dragging much more reliable when
         * the pointer moves quickly outside the card.
         */
        try {
          el.setPointerCapture?.(e.pointerId);
        } catch {
          // Ignore browsers that do not support pointer capture.
        }
      }

      clearTimeout(longPressTimer.current);

      longPressTimer.current = setTimeout(() => {
        if (!pointerDownId.current) return;

        dragActivated.current = true;

        setDraggingId(id);

        document.body.style.userSelect = "none";
        document.body.style.touchAction = "none";

        if (navigator.vibrate) {
          navigator.vibrate(12);
        }

        const dragEl = itemRefs.current.get(id);

        if (dragEl) {
          dragEl.style.transition =
            "transform 120ms ease, box-shadow 120ms ease";

          dragEl.style.boxShadow =
            "0 18px 38px rgba(63, 47, 36, 0.28)";

          dragEl.style.zIndex = "50";
          dragEl.style.willChange = "transform";
        }

        updateDraggedPosition();
      }, LONG_PRESS_MS);

      window.addEventListener(
        "pointermove",
        pointerMoveHandler.current,
        { passive: false }
      );

      window.addEventListener(
        "pointerup",
        pointerUpHandler.current
      );
    },
    [clearListeners, updateDraggedPosition]
  );

  useEffect(() => {
    return () => {
      clearListeners();

      const id = pointerDownId.current;
      const el = id ? itemRefs.current.get(id) : null;

      if (el) {
        el.style.transform = "";
        el.style.transition = "";
        el.style.boxShadow = "";
        el.style.zIndex = "";
        el.style.willChange = "";
      }
    };
  }, [clearListeners]);

  return {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  };
}
