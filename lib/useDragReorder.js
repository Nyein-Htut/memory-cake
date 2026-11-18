"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";


/* ============================================================
   CONFIG
   ============================================================ */

const TOUCH_LONG_PRESS = 280;
const MOUSE_DRAG_THRESHOLD = 5;
const TOUCH_CANCEL_THRESHOLD = 10;

const DROP_ANIMATION_MS = 180;
const OTHER_ITEMS_ANIMATION_MS = 160;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";


/* ============================================================
   INTERACTIVE ELEMENT CHECK
   ============================================================ */

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


/* ============================================================
   MAIN HOOK
   ============================================================ */

export function useDragReorder(
  items,
  setItems,
  onReorderEnd
) {
  const [draggingId, setDraggingId] = useState(null);


  /* ----------------------------------------------------------
     Latest items
     ---------------------------------------------------------- */

  const itemsRef = useRef(items);
  itemsRef.current = items;


  /* ----------------------------------------------------------
     DOM refs
     ---------------------------------------------------------- */

  const itemRefs = useRef(new Map());


  const registerItemRef = useCallback(
    (id) => (element) => {
      if (element) {
        itemRefs.current.set(id, element);

        // Prevent native browser image dragging.
        element.setAttribute("draggable", "false");
      } else {
        itemRefs.current.delete(id);
      }
    },
    []
  );


  /* ----------------------------------------------------------
     Pointer state
     ---------------------------------------------------------- */

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


  /* ----------------------------------------------------------
     Original card geometry
     ---------------------------------------------------------- */

  const originalRectRef = useRef(null);

  const grabOffsetRef = useRef({
    x: 0,
    y: 0,
  });


  /* ----------------------------------------------------------
     Drag state
     ---------------------------------------------------------- */

  const dragActivatedRef = useRef(false);

  const longPressTimerRef = useRef(null);

  const wasDragRef = useRef(false);


  /* ----------------------------------------------------------
     Animation
     ---------------------------------------------------------- */

  const animationFrameRef = useRef(null);

  const pendingPointerRef = useRef(null);


  /* ----------------------------------------------------------
     Reorder state
     ---------------------------------------------------------- */

  const lastTargetIdRef = useRef(null);

  const previousRectsRef = useRef(null);


  /* ==========================================================
     CLEANUP
     ========================================================== */

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);


  const cancelFrame = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(
        animationFrameRef.current
      );

      animationFrameRef.current = null;
    }

    pendingPointerRef.current = null;
  }, []);


  const restoreDocument = useCallback(() => {
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
    document.body.style.touchAction = "";
    document.body.style.overflow = "";
  }, []);


  /* ==========================================================
     FIND TARGET
     ========================================================== */

  const findTarget = useCallback(
    (x, y, draggedId) => {
      for (
        const [id, element]
        of itemRefs.current.entries()
      ) {
        if (id === draggedId) {
          continue;
        }

        const rect =
          element.getBoundingClientRect();

        /*
         * Only consider an item when the pointer is
         * physically inside it.
         *
         * This prevents the old "closest card" behavior
         * from constantly switching between neighboring
         * items.
         */
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


  /* ==========================================================
     APPLY DRAG POSITION
     ========================================================== */

  const updateDraggedElement = useCallback(() => {
    animationFrameRef.current = null;

    if (!dragActivatedRef.current) {
      return;
    }

    const id = pointerDownId.current;

    if (id === null) {
      return;
    }

    const element =
      itemRefs.current.get(id);

    if (!element) {
      return;
    }

    const pointer =
      pendingPointerRef.current;

    if (!pointer) {
      return;
    }


    /*
     * Since the dragged card is position: fixed,
     * we can directly position it under the pointer.
     *
     * No repeated getBoundingClientRect().
     * No transform accumulation.
     * No dependency on where React has placed the card.
     */
    const left =
      pointer.x -
      grabOffsetRef.current.x;

    const top =
      pointer.y -
      grabOffsetRef.current.y;


    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  }, []);


  const scheduleDraggedElementUpdate =
    useCallback(
      (x, y) => {
        pendingPointerRef.current = {
          x,
          y,
        };

        if (
          animationFrameRef.current !== null
        ) {
          return;
        }

        animationFrameRef.current =
          requestAnimationFrame(
            updateDraggedElement
          );
      },
      [updateDraggedElement]
    );


  /* ==========================================================
     START DRAG
     ========================================================== */

  const startDrag = useCallback(() => {
    if (dragActivatedRef.current) {
      return;
    }

    const id =
      pointerDownId.current;

    if (id === null) {
      return;
    }

    const element =
      itemRefs.current.get(id);

    if (!element) {
      return;
    }


    const rect =
      element.getBoundingClientRect();


    /*
     * Save original dimensions.
     *
     * The dragged card keeps exactly the same size
     * while floating above the other cards.
     */
    originalRectRef.current = {
      width: rect.width,
      height: rect.height,
    };


    /*
     * IMPORTANT:
     *
     * The card becomes position: fixed.
     *
     * This completely separates the dragged element
     * from the grid/list layout.
     */
    element.style.position = "fixed";

    element.style.left =
      `${rect.left}px`;

    element.style.top =
      `${rect.top}px`;

    element.style.width =
      `${rect.width}px`;

    element.style.height =
      `${rect.height}px`;

    element.style.margin = "0";

    element.style.zIndex = "9999";

    element.style.willChange =
      "left, top";

    element.style.pointerEvents =
      "none";

    element.style.transition =
      "box-shadow 120ms ease, transform 120ms ease";

    element.style.transform =
      "scale(1.025)";

    element.style.boxShadow =
      "0 18px 42px rgba(63, 47, 36, 0.25)";


    /*
     * Lock scrolling once the drag is actually active.
     */
    document.body.style.userSelect =
      "none";

    document.body.style.webkitUserSelect =
      "none";

    document.body.style.touchAction =
      "none";


    dragActivatedRef.current = true;

    setDraggingId(id);

    lastTargetIdRef.current = null;


    /*
     * Immediately position the card under the
     * current pointer.
     */
    scheduleDraggedElementUpdate(
      lastPointer.current.x,
      lastPointer.current.y
    );
  }, [
    scheduleDraggedElementUpdate,
  ]);


  /* ==========================================================
     REORDER
     ========================================================== */

  const reorder = useCallback(
    (targetId) => {
      const draggedId =
        pointerDownId.current;

      if (
        draggedId === null ||
        targetId === null ||
        draggedId === targetId
      ) {
        return;
      }


      /*
       * Don't reorder against the same item
       * over and over again.
       */
      if (
        lastTargetIdRef.current ===
        targetId
      ) {
        return;
      }


      const current =
        itemsRef.current;


      const fromIndex =
        current.findIndex(
          (item) =>
            item.id === draggedId
        );


      const targetIndex =
        current.findIndex(
          (item) =>
            item.id === targetId
        );


      if (
        fromIndex === -1 ||
        targetIndex === -1 ||
        fromIndex === targetIndex
      ) {
        return;
      }


      /*
       * Capture positions before React changes
       * the order.
       */
      const rects = new Map();

      for (
        const [id, element]
        of itemRefs.current.entries()
      ) {
        /*
         * The dragged element is position: fixed,
         * so exclude it from FLIP.
         */
        if (id === draggedId) {
          continue;
        }

        rects.set(
          id,
          element.getBoundingClientRect()
        );
      }


      previousRectsRef.current =
        rects;


      /*
       * Reorder the array.
       */
      const next = [...current];

      const [moved] =
        next.splice(fromIndex, 1);

      next.splice(
        targetIndex,
        0,
        moved
      );


      lastTargetIdRef.current =
        targetId;

      setItems(next);
    },
    [setItems]
  );


  /* ==========================================================
     POINTER MOVE
     ========================================================== */

  const handlePointerMove =
    useCallback(
      (event) => {
        if (
          pointerIdRef.current !==
          event.pointerId
        ) {
          return;
        }


        const x =
          event.clientX;

        const y =
          event.clientY;


        lastPointer.current = {
          x,
          y,
        };


        /*
         * ==============================================
         * BEFORE DRAG
         * ==============================================
         */

        if (
          !dragActivatedRef.current
        ) {
          const dx =
            x -
            startPointer.current.x;

          const dy =
            y -
            startPointer.current.y;

          const distance =
            Math.hypot(dx, dy);


          /*
           * TOUCH / PEN
           *
           * Movement before long press means
           * the user is probably scrolling.
           */
          if (
            pointerTypeRef.current ===
              "touch" ||
            pointerTypeRef.current ===
              "pen"
          ) {
            if (
              distance >
              TOUCH_CANCEL_THRESHOLD
            ) {
              clearLongPress();

              pointerDownId.current =
                null;

              return;
            }

            return;
          }


          /*
           * MOUSE
           *
           * Intentional movement starts dragging.
           */
          if (
            distance >=
            MOUSE_DRAG_THRESHOLD
          ) {
            clearLongPress();

            startDrag();
          }

          return;
        }


        /*
         * ==============================================
         * ACTIVE DRAG
         * ==============================================
         */

        event.preventDefault();


        /*
         * Move the floating card.
         */
        scheduleDraggedElementUpdate(
          x,
          y
        );


        /*
         * Find the item underneath
         * the pointer.
         */
        const target =
          findTarget(
            x,
            y,
            pointerDownId.current
          );


        /*
         * Pointer is between cards.
         *
         * Don't change order.
         */
        if (!target) {
          return;
        }


        /*
         * Reorder only when we actually
         * enter another card.
         */
        reorder(target.id);
      },
      [
        clearLongPress,
        findTarget,
        reorder,
        scheduleDraggedElementUpdate,
        startDrag,
      ]
    );


  /* ==========================================================
     FINISH DRAG
     ========================================================== */

  const finishDrag =
    useCallback(
      (event) => {
        /*
         * Ignore unrelated pointers.
         */
        if (
          pointerIdRef.current !==
          null &&
          event &&
          event.pointerId !==
            pointerIdRef.current
        ) {
          return;
        }


        clearLongPress();

        cancelFrame();


        const draggedId =
          pointerDownId.current;

        const wasDragging =
          dragActivatedRef.current;


        /*
         * Reset pointer state.
         */
        pointerIdRef.current =
          null;

        pointerTypeRef.current =
          null;

        pointerDownId.current =
          null;

        dragActivatedRef.current =
          false;

        lastTargetIdRef.current =
          null;


        restoreDocument();


        setDraggingId(null);


        /*
         * Normal click/tap.
         */
        if (!wasDragging) {
          return;
        }


        wasDragRef.current =
          true;


        const element =
          itemRefs.current.get(
            draggedId
          );


        if (!element) {
          return;
        }


        /*
         * Current floating position.
         */
        const currentRect =
          element.getBoundingClientRect();


        /*
         * Remove floating positioning.
         *
         * React's current DOM order is now
         * the final resting order.
         */
        element.style.position =
          "";

        element.style.left =
          "";

        element.style.top =
          "";

        element.style.width =
          "";

        element.style.height =
          "";

        element.style.margin =
          "";

        element.style.pointerEvents =
          "";

        element.style.willChange =
          "";

        element.style.zIndex =
          "";


        /*
         * Get the final natural position.
         */
        const finalRect =
          element.getBoundingClientRect();


        /*
         * Calculate the distance from the
         * floating position to its final slot.
         */
        const dx =
          currentRect.left -
          finalRect.left;

        const dy =
          currentRect.top -
          finalRect.top;


        /*
         * Start at the old floating position.
         */
        element.style.transition =
          "none";

        element.style.transform =
          `translate3d(${dx}px, ${dy}px, 0) scale(1.025)`;


        /*
         * Force browser to register
         * the starting position.
         */
        element.getBoundingClientRect();


        /*
         * Smoothly settle into final slot.
         */
        requestAnimationFrame(() => {
          element.style.transition =
            `transform ${DROP_ANIMATION_MS}ms ${EASE}, ` +
            `box-shadow ${DROP_ANIMATION_MS}ms ease`;

          element.style.transform =
            "";

          element.style.boxShadow =
            "";

          element.style.cursor =
            "";

          setTimeout(() => {
            /*
             * Only clean styles that this hook owns.
             */
            element.style.transition =
              "";

            element.style.transform =
              "";
            element.style.boxShadow =
              "";
          }, DROP_ANIMATION_MS + 30);
        });


        /*
         * Persist final order.
         */
        if (
          typeof onReorderEnd ===
          "function"
        ) {
          onReorderEnd(
            itemsRef.current.map(
              (item) =>
                item.id
            )
          );
        }
      },
      [
        cancelFrame,
        clearLongPress,
        onReorderEnd,
        restoreDocument,
      ]
    );


  /* ==========================================================
     POINTER DOWN
     ========================================================== */

  const handlePointerDown =
    useCallback(
      (id) => (event) => {
        /*
         * Ignore secondary mouse buttons
         * and non-primary pointers.
         */
        if (
          event.isPrimary === false
        ) {
          return;
        }

        if (
          event.pointerType ===
            "mouse" &&
          event.button !== 0
        ) {
          return;
        }


        /*
         * NEVER start drag from buttons,
         * links, inputs, etc.
         */
        if (
          isInteractiveElement(
            event.target
          )
        ) {
          return;
        }


        /*
         * Reset old state.
         */
        clearLongPress();

        cancelFrame();


        pointerIdRef.current =
          event.pointerId;

        pointerTypeRef.current =
          event.pointerType;

        pointerDownId.current =
          id;


        startPointer.current = {
          x: event.clientX,
          y: event.clientY,
        };


        lastPointer.current = {
          x: event.clientX,
          y: event.clientY,
        };


        dragActivatedRef.current =
          false;


        wasDragRef.current =
          false;


        lastTargetIdRef.current =
          null;


        /*
         * Calculate the exact place
         * where the user grabbed the card.
         */
        const element =
          itemRefs.current.get(id);


        if (!element) {
          return;
        }


        const rect =
          element.getBoundingClientRect();


        grabOffsetRef.current = {
          x:
            event.clientX -
            rect.left,

          y:
            event.clientY -
            rect.top,
        };


        /*
         * Pointer capture makes dragging
         * much more reliable when the pointer
         * leaves the original card.
         */
        try {
          element.setPointerCapture(
            event.pointerId
          );
        } catch {
          // Safe fallback for older browsers.
        }


        /*
         * TOUCH / PEN
         *
         * Wait for long press.
         */
        if (
          event.pointerType ===
            "touch" ||
          event.pointerType ===
            "pen"
        ) {
          longPressTimerRef.current =
            setTimeout(() => {
              if (
                pointerDownId.current ===
                  id &&
                !dragActivatedRef.current
              ) {
                startDrag();
              }
            }, TOUCH_LONG_PRESS);
        }


        /*
         * MOUSE
         *
         * Drag begins once the mouse
         * moves enough.
         */
        window.addEventListener(
          "pointermove",
          handlePointerMove,
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
        cancelFrame,
        clearLongPress,
        finishDrag,
        handlePointerMove,
        startDrag,
      ]
    );


  /* ==========================================================
     FLIP ANIMATION FOR OTHER ITEMS
     ========================================================== */

  useLayoutEffect(() => {
    const previous =
      previousRectsRef.current;

    if (!previous) {
      return;
    }

    previousRectsRef.current =
      null;


    const draggedId =
      pointerDownId.current;


    for (
      const [id, element]
      of itemRefs.current.entries()
    ) {
      /*
       * The dragged item is floating.
       */
      if (id === draggedId) {
        continue;
      }


      const before =
        previous.get(id);

      if (!before) {
        continue;
      }


      const after =
        element.getBoundingClientRect();


      const dx =
        before.left -
        after.left;

      const dy =
        before.top -
        after.top;


      if (
        Math.abs(dx) < 0.5 &&
        Math.abs(dy) < 0.5
      ) {
        continue;
      }


      /*
       * Start at old position.
       */
      element.style.transition =
        "none";

      element.style.transform =
        `translate3d(${dx}px, ${dy}px, 0)`;


      /*
       * Force layout.
       */
      element.getBoundingClientRect();


      /*
       * Animate to new position.
       */
      requestAnimationFrame(() => {
        element.style.transition =
          `transform ${OTHER_ITEMS_ANIMATION_MS}ms ${EASE}`;

        element.style.transform =
          "";
      });
    }
  }, [items]);


  /* ==========================================================
     CLEANUP
     ========================================================== */

  useEffect(() => {
    return () => {
      clearLongPress();

      cancelFrame();

      restoreDocument();

      window.removeEventListener(
        "pointermove",
        handlePointerMove
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
    cancelFrame,
    clearLongPress,
    finishDrag,
    handlePointerMove,
    restoreDocument,
  ]);


  /* ==========================================================
     RETURN
     ========================================================== */

  return {
    draggingId,
    handlePointerDown,
    registerItemRef,
    wasDragRef,
  };
}
