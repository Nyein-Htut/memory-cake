"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";

/*
 * ============================================================
 * Smooth Drag & Drop Reordering
 * ============================================================
 *
 * Designed for:
 *   - Desktop mouse
 *   - iOS Safari
 *   - Android Chrome
 *   - Touch / pen
 *
 * Behavior:
 *
 * DESKTOP
 *   - Normal click = normal click
 *   - Small mouse movement = normal click
 *   - Drag begins after intentional movement
 *
 * MOBILE
 *   - Normal swipe = scrolling
 *   - Long press = drag
 *   - Small finger movement while waiting = cancels drag
 *
 * IMPORTANT:
 *
 * The whole card can be draggable, BUT interactive elements
 * such as buttons, links, inputs, selects, etc. are excluded.
 *
 * Therefore:
 *
 *   Folder card      -> draggable
 *   Photo card       -> draggable
 *   Edit button      -> clickable
 *   Delete button    -> clickable
 *   Open link        -> clickable
 *   Input            -> usable
 *
 * ============================================================
 */

const MOBILE_LONG_PRESS_MS = 280;

// How much movement is allowed before deciding that the user
// is scrolling/clicking rather than trying to drag.
const TOUCH_MOVE_CANCEL_THRESHOLD = 10;

// Mouse needs intentional movement before drag starts.
const MOUSE_DRAG_THRESHOLD = 5;

// Small distance used to prevent immediate A <-> B swapping
// when the pointer is sitting directly on a boundary.
const REORDER_HYSTERESIS = 8;

// Animation duration for surrounding cards.
const FLIP_DURATION = 180;

// Animation curve.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";


/* ============================================================
 * Helpers
 * ============================================================
 */

/**
 * Elements that should NEVER start a card drag.
 *
 * This is important because otherwise moving the mouse/finger
 * around an Edit button or Delete button can make the whole card
 * start dragging.
 */
function isInteractiveElement(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "button",
        "a",
        "input",
        "textarea",
        "select",
        "option",
        "[role='button']",
        "[role='link']",
        "[contenteditable='true']",
        "[data-no-drag]",
      ].join(",")
    )
  );
}


/**
 * Get the center point of an element.
 */
function getCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}


/**
 * Check whether a pointer is actually inside an element.
 *
 * This is intentionally different from "closest card".
 *
 * The old approach could continually choose the nearest card,
 * even when the pointer was actually between two cards.
 *
 * That can cause:
 *
 *     A -> B -> A -> B -> A
 *
 * which looks like shaking.
 */
function pointInsideRect(x, y, rect) {
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}


/**
 * Find the card directly underneath the pointer.
 *
 * Only the card actually under the pointer becomes a reorder
 * candidate.
 */
function findTargetUnderPointer(
  clientX,
  clientY,
  excludeId,
  itemRefs
) {
  for (const [id, el] of itemRefs.current.entries()) {
    if (id === excludeId) {
      continue;
    }

    const rect = el.getBoundingClientRect();

    if (pointInsideRect(clientX, clientY, rect)) {
      return {
        id,
        rect,
      };
    }
  }

  return null;
}


/* ============================================================
 * Main hook
 * ============================================================
 */

export function useDragReorder(
  items,
  setItems,
  onReorderEnd
) {
  const [draggingId, setDraggingId] = useState(null);

  /*
   * Always keep the latest items available to event handlers.
   *
   * Pointer events are registered outside React's normal render
   * cycle, so relying directly on "items" inside those handlers
   * can produce stale state.
   */
  const itemsRef = useRef(items);
  itemsRef.current = items;


  /*
   * DOM references for every draggable item.
   */
  const itemRefs = useRef(new Map());

  const registerItemRef = useCallback(
    (id) => (element) => {
      if (element) {
        itemRefs.current.set(id, element);

        /*
         * Prevent native browser image dragging.
         *
         * This is especially useful when a photo card contains
         * an <img>.
         */
        element.setAttribute("draggable", "false");
      } else {
        itemRefs.current.delete(id);
      }
    },
    []
  );


  /*
   * ==========================================================
   * Drag state
   * ==========================================================
   */

  const pointerIdRef = useRef(null);

  const pointerTypeRef = useRef(null);

  const pointerDownId = useRef(null);

  const startPointer = useRef({
    x: 0,
    y: 0,
  });

  const lastPointer = useRef({
    x: 0,
    y: 0,
  });


  /*
   * Where inside the card the user grabbed it.
   *
   * Example:
   *
   * If the user grabs 20px from the left edge,
   * the card should stay 20px from the pointer.
   */
  const grabOffset = useRef({
    x: 0,
    y: 0,
  });


  /*
   * Current transform of the dragged item.
   *
   * We keep this in JS rather than repeatedly measuring
   * the transformed element.
   */
  const dragTransform = useRef({
    x: 0,
    y: 0,
  });


  /*
   * Used for requestAnimationFrame.
   *
   * PointerMove can fire much faster than the screen can render.
   * Instead of writing styles on every event, we update once
   * per animation frame.
   */
  const animationFrameRef = useRef(null);

  const pendingPointerRef = useRef(null);


  /*
   * Long press timer for touch devices.
   */
  const longPressTimer = useRef(null);


  /*
   * Whether the drag has actually started.
   */
  const dragActivated = useRef(false);


  /*
   * Used to suppress the click that naturally fires after
   * pointerup following a real drag.
   */
  const wasDragRef = useRef(false);


  /*
   * Prevents repeated reorder operations against the same card.
   */
  const lastReorderTarget = useRef(null);


  /*
   * Before/after positions used for FLIP animation.
   */
  const previousRects = useRef(null);


  /*
   * ==========================================================
   * Cleanup
   * ==========================================================
   */

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);


  const cancelAnimationFrameUpdate = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    pendingPointerRef.current = null;
  }, []);


  const restoreGlobalStyles = useCallback(() => {
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
    document.body.style.touchAction = "";
  }, []);


  /*
   * ==========================================================
   * Apply drag transform
   * ==========================================================
   *
   * IMPORTANT:
   *
   * This does NOT call getBoundingClientRect().
   *
   * That is intentional.
   *
   * Reading layout and immediately writing layout on every
   * pointermove is a common source of jank.
   */
  const applyDragTransform = useCallback(() => {
    animationFrameRef.current = null;

    if (!dragActivated.current) {
      return;
    }

    const id = pointerDownId.current;

    if (id === null) {
      return;
    }

    const element = itemRefs.current.get(id);

    if (!element) {
      return;
    }

    const { x, y } = dragTransform.current;

    element.style.transform =
      `translate3d(${x}px, ${y}px, 0) scale(1.025)`;
  }, []);


  /*
   * Schedule one visual update for the next animation frame.
   */
  const scheduleDragTransform = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current =
      requestAnimationFrame(applyDragTransform);
  }, [applyDragTransform]);


  /*
   * ==========================================================
   * Start drag
   * ==========================================================
   */

  const startDrag = useCallback(() => {
    if (dragActivated.current) {
      return;
    }

    const id = pointerDownId.current;

    if (id === null) {
      return;
    }

    const element = itemRefs.current.get(id);

    if (!element) {
      return;
    }

    dragActivated.current = true;

    setDraggingId(id);

    /*
     * Once a drag is actually active, scrolling must stop.
     */
    document.body.style.touchAction = "none";

    document.body.style.userSelect = "none";

    document.body.style.webkitUserSelect = "none";


    /*
     * Visual feedback.
     *
     * Keep this very small.
     * Large scaling tends to make cards look like they
     * are jumping around each other.
     */
    element.style.transition =
      "transform 100ms ease, box-shadow 100ms ease";

    element.style.boxShadow =
      "0 16px 36px rgba(63, 47, 36, 0.24)";

    element.style.zIndex = "100";

    element.style.willChange = "transform";

    element.style.cursor = "grabbing";


    /*
     * Start from the current position.
     */
    dragTransform.current = {
      x: 0,
      y: 0,
    };

    lastReorderTarget.current = null;

    wasDragRef.current = false;

    scheduleDragTransform();
  }, [scheduleDragTransform]);


  /*
   * ==========================================================
   * Reorder
   * ==========================================================
   */

  const reorderItems = useCallback(
    (targetId) => {
      const draggedId = pointerDownId.current;

      if (
        draggedId === null ||
        targetId === null ||
        draggedId === targetId
      ) {
        return;
      }

      /*
       * Do not repeatedly reorder against the same target.
       */
      if (lastReorderTarget.current === targetId) {
        return;
      }

      const currentItems = itemsRef.current;

      const fromIndex = currentItems.findIndex(
        (item) => item.id === draggedId
      );

      const targetIndex = currentItems.findIndex(
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
       * ======================================================
       * Capture current layout BEFORE React changes the order.
       * ======================================================
       */
      const rects = new Map();

      for (const [id, element] of itemRefs.current.entries()) {
        rects.set(id, element.getBoundingClientRect());
      }

      previousRects.current = rects;


      /*
       * Move the dragged item.
       */
      const nextItems = [...currentItems];

      const [movedItem] = nextItems.splice(fromIndex, 1);

      nextItems.splice(targetIndex, 0, movedItem);

      lastReorderTarget.current = targetId;

      setItems(nextItems);
    },
    [setItems]
  );


  /*
   * ==========================================================
   * Pointer movement
   * ==========================================================
   */

  const processPointerMove = useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) {
        return;
      }

      const x = event.clientX;
      const y = event.clientY;

      lastPointer.current = {
        x,
        y,
      };


      /*
       * --------------------------------------------------------
       * BEFORE DRAG STARTS
       * --------------------------------------------------------
       */

      if (!dragActivated.current) {
        const dx = x - startPointer.current.x;
        const dy = y - startPointer.current.y;

        const distance = Math.hypot(dx, dy);


        /*
         * Touch:
         *
         * If the user moves their finger before the long press
         * completes, assume they want to scroll.
         */
        if (
          pointerTypeRef.current === "touch" ||
          pointerTypeRef.current === "pen"
        ) {
          if (distance > TOUCH_MOVE_CANCEL_THRESHOLD) {
            clearLongPress();

            pointerDownId.current = null;

            return;
          }

          return;
        }


        /*
         * Mouse:
         *
         * Mouse dragging starts naturally once the user
         * intentionally moves the pointer.
         */
        if (distance >= MOUSE_DRAG_THRESHOLD) {
          clearLongPress();

          startDrag();
        }

        return;
      }


      /*
       * --------------------------------------------------------
       * ACTIVE DRAG
       * --------------------------------------------------------
       */

      event.preventDefault();


      /*
       * Calculate the new transform WITHOUT measuring the DOM.
       *
       * This is one of the biggest performance improvements
       * over the previous implementation.
       */
      const newTransform = {
        x:
          x -
          startPointer.current.x,

        y:
          y -
          startPointer.current.y,
      };


      dragTransform.current = newTransform;

      scheduleDragTransform();


      /*
       * Find the card actually underneath the pointer.
       *
       * We deliberately do NOT use "closest card".
       */
      const target = findTargetUnderPointer(
        x,
        y,
        pointerDownId.current,
        itemRefs
      );


      /*
       * If the pointer is between cards, do nothing.
       *
       * This prevents the shaking/oscillation problem.
       */
      if (!target) {
        return;
      }


      /*
       * Small hysteresis:
       *
       * If the pointer is sitting extremely close to an edge,
       * don't immediately flip between neighboring cards.
       */
      const center = getCenter(target.rect);

      const distanceToCenter = Math.hypot(
        x - center.x,
        y - center.y
      );

      /*
       * For very small cards, don't apply excessive hysteresis.
       */
      const hysteresis =
        Math.min(
          REORDER_HYSTERESIS,
          Math.min(
            target.rect.width,
            target.rect.height
          ) * 0.08
        );


      /*
       * Once the pointer is clearly inside the target,
       * reorder it.
       */
      if (
        distanceToCenter >= hysteresis ||
        lastReorderTarget.current !== target.id
      ) {
        reorderItems(target.id);
      }
    },
    [
      clearLongPress,
      reorderItems,
      scheduleDragTransform,
      startDrag,
    ]
  );


  /*
   * ==========================================================
   * Pointer up
   * ==========================================================
   */

  const finishDrag = useCallback(
    (event) => {
      if (
        pointerIdRef.current !== null &&
        event &&
        event.pointerId !== pointerIdRef.current
      ) {
        return;
      }

      clearLongPress();

      cancelAnimationFrameUpdate();

      const draggedId = pointerDownId.current;

      const wasActivated = dragActivated.current;


      /*
       * Reset pointer state first.
       */
      pointerIdRef.current = null;

      pointerTypeRef.current = null;

      pointerDownId.current = null;

      dragActivated.current = false;

      lastReorderTarget.current = null;

      restoreGlobalStyles();

      setDraggingId(null);


      /*
       * If this was only a click/tap,
       * don't do any drag cleanup.
       */
      if (!wasActivated) {
        return;
      }


      /*
       * Tell click handlers that this pointer sequence
       * was a drag.
       *
       * This allows the card's onClick / Link handler to
       * suppress the accidental click that follows a drag.
       */
      wasDragRef.current = true;


      const element = itemRefs.current.get(draggedId);

      if (!element) {
        return;
      }


      /*
       * Read the element's current position once.
       *
       * Then remove the drag transform and measure its natural
       * resting position.
       */
      const currentRect =
        element.getBoundingClientRect();

      const currentTransform =
        dragTransform.current;


      /*
       * The current visual position is:
       *
       *     natural position + drag transform
       *
       * We temporarily remove the transform so we can find
       * the natural resting position.
       */
      element.style.transition = "none";

      element.style.transform = "none";

      const restingRect =
        element.getBoundingClientRect();


      /*
       * Calculate how far the card needs to animate
       * from its current visual location to its final slot.
       */
      const visualLeft =
        currentRect.left;

      const visualTop =
        currentRect.top;

      const deltaX =
        visualLeft - restingRect.left;

      const deltaY =
        visualTop - restingRect.top;


      /*
       * Start from the current visual position.
       */
      element.style.transform =
        `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.025)`;


      /*
       * Force the browser to register the starting position.
       */
      element.getBoundingClientRect();


      /*
       * Animate into the final resting slot.
       */
      requestAnimationFrame(() => {
        element.style.transition =
          `transform ${FLIP_DURATION}ms ${EASE}, ` +
          `box-shadow ${FLIP_DURATION}ms ease`;

        element.style.transform = "";

        element.style.boxShadow = "";

        element.style.zIndex = "";

        element.style.willChange = "";

        element.style.cursor = "";
      });


      /*
       * Persist the final ordering.
       */
      const orderedIds =
        itemsRef.current.map((item) => item.id);

      if (typeof onReorderEnd === "function") {
        onReorderEnd(orderedIds);
      }
    },
    [
      cancelAnimationFrameUpdate,
      clearLongPress,
      onReorderEnd,
      restoreGlobalStyles,
    ]
  );


  /*
   * ==========================================================
   * Pointer down
   * ==========================================================
   */

  const handlePointerDown = useCallback(
    (id) => (event) => {
      /*
       * Ignore anything except the primary pointer.
       *
       * This prevents weird behavior with:
       *   - right mouse button
       *   - multiple fingers
       *   - secondary pen buttons
       */
      if (event.isPrimary === false) {
        return;
      }

      if (
        event.pointerType === "mouse" &&
        event.button !== 0
      ) {
        return;
      }


      /*
       * Do NOT start dragging from buttons, links,
       * inputs, etc.
       */
      if (isInteractiveElement(event.target)) {
        return;
      }


      /*
       * Prevent native image dragging.
       */
      if (
        event.target instanceof HTMLImageElement
      ) {
        event.preventDefault();
      }


      /*
       * If another drag somehow exists, clean it first.
       */
      clearLongPress();

      cancelAnimationFrameUpdate();


      /*
       * Store pointer identity.
       */
      pointerIdRef.current =
        event.pointerId;

      pointerTypeRef.current =
        event.pointerType;


      pointerDownId.current = id;


      /*
       * Store starting pointer position.
       */
      startPointer.current = {
        x: event.clientX,
        y: event.clientY,
      };


      lastPointer.current = {
        x: event.clientX,
        y: event.clientY,
      };


      /*
       * Reset drag state.
       */
      dragActivated.current = false;

      dragTransform.current = {
        x: 0,
        y: 0,
      };

      lastReorderTarget.current = null;

      wasDragRef.current = false;


      /*
       * Calculate where inside the card the pointer landed.
       */
      const element =
        itemRefs.current.get(id);

      if (element) {
        const rect =
          element.getBoundingClientRect();

        grabOffset.current = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };


        /*
         * Pointer capture is especially important on mobile.
         *
         * Once the finger starts dragging, the element continues
         * receiving pointer events even if the finger moves
         * outside the original card.
         */
        try {
          element.setPointerCapture(
            event.pointerId
          );
        } catch {
          // Some older browsers may not support it.
        }
      }


      /*
       * ======================================================
       * MOBILE
       * ======================================================
       *
       * Wait for a long press.
       *
       * This means:
       *
       *     swipe -> scroll
       *     tap   -> click
       *     hold  -> drag
       */
      if (
        event.pointerType === "touch" ||
        event.pointerType === "pen"
      ) {
        longPressTimer.current =
          setTimeout(() => {
            if (
              pointerDownId.current === id &&
              !dragActivated.current
            ) {
              startDrag();
            }
          }, MOBILE_LONG_PRESS_MS);
      }


      /*
       * ======================================================
       * MOUSE
       * ======================================================
       *
       * We don't activate immediately.
       *
       * The drag begins when pointer movement exceeds the
       * small mouse threshold.
       */
      window.addEventListener(
        "pointermove",
        processPointerMove,
        {
          passive: false,
        }
      );

      window.addEventListener(
        "pointerup",
        finishDrag,
        {
          passive: false,
        }
      );

      window.addEventListener(
        "pointercancel",
        finishDrag,
        {
          passive: false,
        }
      );
    },
    [
      cancelAnimationFrameUpdate,
      clearLongPress,
      finishDrag,
      processPointerMove,
      startDrag,
    ]
  );


  /*
   * ==========================================================
   * FLIP animation after React reorders the list
   * ==========================================================
   *
   * This is what makes the OTHER cards glide into place.
   */
  useLayoutEffect(() => {
    if (!previousRects.current) {
      return;
    }

    const beforeRects =
      previousRects.current;

    previousRects.current = null;


    for (const [id, element] of itemRefs.current.entries()) {
      /*
       * Don't animate the card being actively dragged.
       */
      if (id === pointerDownId.current) {
        continue;
      }

      const before =
        beforeRects.get(id);

      if (!before) {
        continue;
      }


      const after =
        element.getBoundingClientRect();


      const deltaX =
        before.left - after.left;

      const deltaY =
        before.top - after.top;


      /*
       * No movement -> no animation.
       */
      if (
        Math.abs(deltaX) < 0.5 &&
        Math.abs(deltaY) < 0.5
      ) {
        continue;
      }


      /*
       * Start at the old position.
       */
      element.style.transition = "none";

      element.style.transform =
        `translate3d(${deltaX}px, ${deltaY}px, 0)`;


      /*
       * Force layout so the browser sees the starting point.
       */
      element.getBoundingClientRect();


      /*
       * Animate into the new position.
       */
      requestAnimationFrame(() => {
        element.style.transition =
          `transform ${FLIP_DURATION}ms ${EASE}`;

        element.style.transform = "";
      });
    }


    /*
     * ========================================================
     * IMPORTANT:
     *
     * React has just moved the dragged item to its new
     * natural slot.
     *
     * We need to adjust its transform so it DOES NOT jump.
     * ========================================================
     */
    if (dragActivated.current) {
      const draggedId =
        pointerDownId.current;

      if (draggedId !== null) {
        const draggedElement =
          itemRefs.current.get(draggedId);

        if (draggedElement) {
          /*
           * The transform currently represents where the
           * pointer expects the card to be.
           *
           * Read the new natural position.
           */
          const newRect =
            draggedElement.getBoundingClientRect();


          /*
           * We don't modify the transform here.
           *
           * The next pointer frame will calculate the visual
           * transform from the pointer position.
           *
           * This prevents the dragged item from accumulating
           * transforms after repeated reorder operations.
           */
          void newRect;
        }
      }
    }
  }, [items]);


  /*
   * ==========================================================
   * Global cleanup
   * ==========================================================
   */

  useEffect(() => {
    return () => {
      clearLongPress();

      cancelAnimationFrameUpdate();

      restoreGlobalStyles();

      window.removeEventListener(
        "pointermove",
        processPointerMove
      );

      window.removeEventListener(
        "pointerup",
        finishDrag
      );

      window.removeEventListener(
        "pointercancel",
        finishDrag
      );
    };
  }, [
    cancelAnimationFrameUpdate,
    clearLongPress,
    finishDrag,
    processPointerMove,
    restoreGlobalStyles,
  ]);


  /*
   * ==========================================================
   * Return API
   * ==========================================================
   */

  return {
    draggingId,

    handlePointerDown,

    registerItemRef,

    wasDragRef,
  };
}
