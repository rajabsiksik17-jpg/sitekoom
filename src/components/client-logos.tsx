"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/config";
import type { Project } from "@/lib/types";

type ClientLogosProps = {
  logos: Project[];
  locale: "ar" | "en";
  title?: {
    ar: string;
    en: string;
  };
};

const DESKTOP_SPEED = 45;
const TABLET_SPEED = 42;
const MOBILE_SPEED = 38;

const MOBILE_BREAKPOINT = 640;
const TABLET_BREAKPOINT = 1024;

export function ClientLogos({
  logos,
  locale,
  title,
}: ClientLogosProps) {
  const isArabic = locale === "ar";

  const sectionTitle = title ?? {
    ar: "عملاؤنا وشركاؤنا",
    en: "Our Clients & Partners",
  };

  const heading = isArabic
    ? sectionTitle.ar
    : sectionTitle.en;

  /*
   * Keep only real unique projects.
   *
   * IMPORTANT:
   * There are NO cloned logos.
   * Every logo that appears on screen represents one
   * real project from the database.
   */
  const clients = useMemo(() => {
    return Array.from(
      new Map(
        logos
          .filter(
            (project) =>
              Boolean(project?.id) &&
              Boolean(project?.logo)
          )
          .map((project) => [
            project.id,
            project,
          ])
      ).values()
    );
  }, [logos]);

  const viewportRef =
    useRef<HTMLDivElement | null>(null);

  const logoRefs =
    useRef<Array<HTMLAnchorElement | null>>([]);

  /*
   * Current X position of every logo.
   */
  const positionsRef = useRef<number[]>([]);

  /*
   * Distance between the beginning of each logo.
   */
  const spacingRef = useRef(0);

  /*
   * Actual logo width.
   */
  const logoWidthRef = useRef(0);

  /*
   * Current viewport width.
   */
  const viewportWidthRef = useRef(0);

  /*
   * Current movement speed.
   */
  const speedRef = useRef(DESKTOP_SPEED);

  /*
   * Animation state.
   */
  const animationFrameRef =
    useRef<number | null>(null);

  const lastFrameTimeRef =
    useRef<number | null>(null);

  const initializedRef = useRef(false);

  /*
   * Interaction states.
   */
  const pausedRef = useRef(false);

  const hoveredRef = useRef(false);

  const touchingRef = useRef(false);

  const draggingRef = useRef(false);

  const horizontalDragRef = useRef(false);

  const dragMovedRef = useRef(false);

  const lastPointerXRef = useRef(0);

  const pointerIdRef =
    useRef<number | null>(null);

  /*
   * Respect reduced motion.
   */
  const reducedMotionRef = useRef(false);

  /*
   * Get speed according to viewport.
   */
  const getSpeed = useCallback(() => {
    if (typeof window === "undefined") {
      return DESKTOP_SPEED;
    }

    if (window.innerWidth < MOBILE_BREAKPOINT) {
      return MOBILE_SPEED;
    }

    if (window.innerWidth < TABLET_BREAKPOINT) {
      return TABLET_SPEED;
    }

    return DESKTOP_SPEED;
  }, []);

  /*
   * Write the current position directly to DOM.
   *
   * This avoids React re-rendering every frame.
   */
  const applyPosition = useCallback(
    (
      element: HTMLAnchorElement,
      x: number
    ) => {
      element.style.transform =
        "translate3d(" +
        x +
        "px, -50%, 0)";
    },
    []
  );

  /*
   * Apply all current positions.
   */
  const applyAllPositions = useCallback(() => {
    positionsRef.current.forEach(
      (x, index) => {
        const element =
          logoRefs.current[index];

        if (!element) {
          return;
        }

        applyPosition(element, x);
      }
    );
  }, [applyPosition]);

  /*
   * Initialize all logos.
   *
   * Arabic:
   *   First logo starts on the RIGHT
   *   and moves toward the LEFT.
   *
   * English:
   *   First logo starts on the LEFT
   *   and moves toward the RIGHT.
   *
   * There is only ONE DOM element per logo.
   */
  const initializePositions = useCallback(() => {
    const viewport =
      viewportRef.current;

    if (!viewport || clients.length === 0) {
      return;
    }

    const viewportWidth =
      viewport.getBoundingClientRect().width;

    if (viewportWidth <= 0) {
      return;
    }

    const firstLogo =
      logoRefs.current[0];

    if (!firstLogo) {
      return;
    }

    const logoWidth =
      firstLogo.getBoundingClientRect().width;

    if (logoWidth <= 0) {
      return;
    }

    const speed = getSpeed();

    /*
     * Responsive gap.
     */
    let minimumGap = 24;

    if (window.innerWidth >= TABLET_BREAKPOINT) {
      minimumGap = 32;
    } else if (
      window.innerWidth >= MOBILE_BREAKPOINT
    ) {
      minimumGap = 28;
    }

    /*
     * Spread the real logos across the available
     * viewport when there are only a few logos.
     *
     * No duplicates are created to fill space.
     */
    const spacing = Math.max(
      logoWidth + minimumGap,
      viewportWidth / clients.length
    );

    viewportWidthRef.current =
      viewportWidth;

    logoWidthRef.current =
      logoWidth;

    spacingRef.current =
      spacing;

    speedRef.current =
      speed;

    positionsRef.current =
      clients.map((_, index) => {
        if (isArabic) {
          /*
           * RTL:
           *
           * First logo = right
           * Second = left of first
           * Third = left of second
           */
          return (
            viewportWidth -
            logoWidth -
            index * spacing
          );
        }

        /*
         * LTR:
         *
         * First logo = left
         * Second = right of first
         * Third = right of second
         */
        return index * spacing;
      });

    applyAllPositions();

    initializedRef.current = true;

    lastFrameTimeRef.current =
      performance.now();
  }, [
    clients,
    getSpeed,
    isArabic,
    applyAllPositions,
  ]);

  /*
   * Update pause state.
   */
  const syncPausedState = useCallback(() => {
    pausedRef.current =
      hoveredRef.current ||
      touchingRef.current ||
      draggingRef.current;
  }, []);

  /*
   * Move every logo by delta.
   */
  const moveLogos = useCallback(
    (delta: number) => {
      const viewportWidth =
        viewportWidthRef.current;

      const logoWidth =
        logoWidthRef.current;

      const spacing =
        spacingRef.current;

      const positions =
        positionsRef.current;

      if (
        viewportWidth <= 0 ||
        logoWidth <= 0 ||
        spacing <= 0 ||
        positions.length === 0
      ) {
        return;
      }

      /*
       * Arabic / RTL
       *
       * Move from right -> left.
       */
      if (isArabic) {
        for (
          let index = 0;
          index < positions.length;
          index += 1
        ) {
          positions[index] -= delta;
        }

        /*
         * Find every logo that completely left
         * the left side.
         *
         * Move it to the RIGHT of the current
         * right-most logo.
         */
        for (
          let index = 0;
          index < positions.length;
          index += 1
        ) {
          if (
            positions[index] +
              logoWidth <
            0
          ) {
            let rightMost =
              positions[0];

            for (
              let i = 1;
              i < positions.length;
              i += 1
            ) {
              if (
                positions[i] >
                rightMost
              ) {
                rightMost =
                  positions[i];
              }
            }

            positions[index] =
              rightMost + spacing;
          }
        }
      } else {
        /*
         * English / LTR
         *
         * Move from left -> right.
         */
        for (
          let index = 0;
          index < positions.length;
          index += 1
        ) {
          positions[index] += delta;
        }

        /*
         * Find every logo that completely left
         * the right side.
         *
         * Move it to the LEFT of the current
         * left-most logo.
         */
        for (
          let index = 0;
          index < positions.length;
          index += 1
        ) {
          if (
            positions[index] >
            viewportWidth
          ) {
            let leftMost =
              positions[0];

            for (
              let i = 1;
              i < positions.length;
              i += 1
            ) {
              if (
                positions[i] <
                leftMost
              ) {
                leftMost =
                  positions[i];
              }
            }

            positions[index] =
              leftMost - spacing;
          }
        }
      }

      applyAllPositions();
    },
    [applyAllPositions, isArabic]
  );

  /*
   * Main animation loop.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const updateReducedMotion = () => {
      reducedMotionRef.current =
        mediaQuery.matches;
    };

    updateReducedMotion();

    mediaQuery.addEventListener(
      "change",
      updateReducedMotion
    );

    let mounted = true;

    const frame = (now: number) => {
      if (!mounted) {
        return;
      }

      if (
        lastFrameTimeRef.current ===
        null
      ) {
        lastFrameTimeRef.current =
          now;
      }

      const elapsed =
        Math.min(
          now -
            lastFrameTimeRef.current,
          50
        );

      lastFrameTimeRef.current =
        now;

      if (
        !pausedRef.current &&
        !reducedMotionRef.current &&
        initializedRef.current
      ) {
        const delta =
          speedRef.current *
          (elapsed / 1000);

        if (delta > 0) {
          moveLogos(delta);
        }
      }

      animationFrameRef.current =
        window.requestAnimationFrame(
          frame
        );
    };

    animationFrameRef.current =
      window.requestAnimationFrame(
        frame
      );

    return () => {
      mounted = false;

      if (
        animationFrameRef.current !==
        null
      ) {
        window.cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      animationFrameRef.current = null;

      mediaQuery.removeEventListener(
        "change",
        updateReducedMotion
      );
    };
  }, [clients.length, moveLogos]);

  /*
   * Initial measurement + responsive resize.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    let resizeTimer:
      | number
      | null = null;

    const initialize = () => {
      initializedRef.current =
        false;

      initializePositions();
    };

    const delayedInitialize = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(
          resizeTimer
        );
      }

      resizeTimer =
        window.setTimeout(
          initialize,
          80
        );
    };

    const initialTimer =
      window.setTimeout(
        initialize,
        100
      );

    window.addEventListener(
      "resize",
      delayedInitialize
    );

    return () => {
      window.clearTimeout(
        initialTimer
      );

      if (resizeTimer !== null) {
        window.clearTimeout(
          resizeTimer
        );
      }

      window.removeEventListener(
        "resize",
        delayedInitialize
      );
    };
  }, [
    clients.length,
    initializePositions,
  ]);

  /*
   * Re-initialize after logos finish loading.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    const images =
      viewportRef.current?.querySelectorAll(
        "img"
      );

    if (!images) {
      return;
    }

    const handleImageLoad = () => {
      initializePositions();
    };

    images.forEach((image) => {
      image.addEventListener(
        "load",
        handleImageLoad
      );
    });

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          handleImageLoad
        );
      });
    };
  }, [
    clients.length,
    initializePositions,
  ]);

  /*
   * Pause when mouse enters.
   */
  const handlePointerEnter =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (
          event.pointerType === "mouse"
        ) {
          hoveredRef.current =
            true;

          syncPausedState();
        }
      },
      [syncPausedState]
    );

  /*
   * Resume when mouse leaves.
   */
  const handlePointerLeave =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (
          event.pointerType === "mouse"
        ) {
          hoveredRef.current =
            false;

          syncPausedState();
        }
      },
      [syncPausedState]
    );

  /*
   * Pointer down:
   *
   * - Mouse: pause immediately.
   * - Touch: pause immediately.
   * - Also prepare horizontal dragging.
   */
  const handlePointerDown =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        pointerIdRef.current =
          event.pointerId;

        lastPointerXRef.current =
          event.clientX;

        horizontalDragRef.current =
          false;

        dragMovedRef.current =
          false;

        draggingRef.current =
          true;

        if (
          event.pointerType === "touch"
        ) {
          touchingRef.current =
            true;
        }

        syncPausedState();

        try {
          event.currentTarget.setPointerCapture(
            event.pointerId
          );
        } catch {
          /*
           * Pointer capture is not available
           * in some older environments.
           */
        }
      },
      [syncPausedState]
    );

  /*
   * Pointer move:
   *
   * Allows the user to physically drag the
   * logos on mobile/tablet/desktop.
   *
   * Vertical page scrolling is preserved.
   */
  const handlePointerMove =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (
          !draggingRef.current
        ) {
          return;
        }

        if (
          pointerIdRef.current !==
          event.pointerId
        ) {
          return;
        }

        const currentX =
          event.clientX;

        const deltaX =
          currentX -
          lastPointerXRef.current;

        lastPointerXRef.current =
          currentX;

        if (
          !horizontalDragRef.current
        ) {
          if (
            Math.abs(deltaX) < 4
          ) {
            return;
          }

          horizontalDragRef.current =
            true;

          dragMovedRef.current =
            true;
        }

        /*
         * Prevent browser handling of horizontal
         * dragging once horizontal intent is clear.
         */
        event.preventDefault();

        /*
         * The movement direction follows the
         * user's finger/mouse.
         */
        const positions =
          positionsRef.current;

        for (
          let index = 0;
          index < positions.length;
          index += 1
        ) {
          positions[index] +=
            deltaX;
        }

        /*
         * Keep the same seamless wrap behavior
         * while manually dragging.
         */
        const viewportWidth =
          viewportWidthRef.current;

        const logoWidth =
          logoWidthRef.current;

        const spacing =
          spacingRef.current;

        if (
          isArabic
        ) {
          /*
           * RTL manual drag:
           * use the same wrapping logic.
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            if (
              positions[index] +
                logoWidth <
              0
            ) {
              let rightMost =
                positions[0];

              for (
                let i = 1;
                i < positions.length;
                i += 1
              ) {
                if (
                  positions[i] >
                  rightMost
                ) {
                  rightMost =
                    positions[i];
                }
              }

              positions[index] =
                rightMost + spacing;
            }
          }

          /*
           * If user drags strongly to the right,
           * also handle logos leaving from the
           * right edge.
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            if (
              positions[index] >
              viewportWidth
            ) {
              let leftMost =
                positions[0];

              for (
                let i = 1;
                i < positions.length;
                i += 1
              ) {
                if (
                  positions[i] <
                  leftMost
                ) {
                  leftMost =
                    positions[i];
                }
              }

              positions[index] =
                leftMost - spacing;
            }
          }
        } else {
          /*
           * LTR manual drag.
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            if (
              positions[index] >
              viewportWidth
            ) {
              let leftMost =
                positions[0];

              for (
                let i = 1;
                i < positions.length;
                i += 1
              ) {
                if (
                  positions[i] <
                  leftMost
                ) {
                  leftMost =
                    positions[i];
                }
              }

              positions[index] =
                leftMost - spacing;
            }
          }

          /*
           * Also support dragging strongly
           * toward the opposite direction.
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            if (
              positions[index] +
                logoWidth <
              0
            ) {
              let rightMost =
                positions[0];

              for (
                let i = 1;
                i < positions.length;
                i += 1
              ) {
                if (
                  positions[i] >
                  rightMost
                ) {
                  rightMost =
                    positions[i];
                }
              }

              positions[index] =
                rightMost + spacing;
            }
          }
        }

        applyAllPositions();
      },
      [applyAllPositions, isArabic]
    );

  /*
   * Pointer up:
   * release touch/drag pause.
   */
  const handlePointerUp =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (
          pointerIdRef.current !==
          event.pointerId
        ) {
          return;
        }

        draggingRef.current =
          false;

        touchingRef.current =
          false;

        horizontalDragRef.current =
          false;

        pointerIdRef.current =
          null;

        /*
         * Mouse remains paused if the cursor
         * is still inside the slider.
         */
        syncPausedState();

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        } catch {
          /*
           * Ignore unsupported pointer capture.
           */
        }
      },
      [syncPausedState]
    );

  /*
   * Pointer cancel.
   */
  const handlePointerCancel =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        draggingRef.current =
          false;

        touchingRef.current =
          false;

        horizontalDragRef.current =
          false;

        pointerIdRef.current =
          null;

        syncPausedState();

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        } catch {
          /*
           * Ignore unsupported pointer capture.
           */
        }
      },
      [syncPausedState]
    );

  /*
   * Prevent opening a project when the user
   * actually dragged the slider.
   */
  const handleLogoClick =
    useCallback(
      (
        event: React.MouseEvent<HTMLAnchorElement>
      ) => {
        if (
          dragMovedRef.current
        ) {
          event.preventDefault();
          event.stopPropagation();

          dragMovedRef.current =
            false;
        }
      },
      []
    );

  /*
   * Keyboard accessibility:
   *
   * Space / Enter pauses the slider.
   */
  const handleKeyDown =
    useCallback(
      (
        event: React.KeyboardEvent<HTMLDivElement>
      ) => {
        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {
          return;
        }

        event.preventDefault();

        hoveredRef.current =
          !hoveredRef.current;

        syncPausedState();
      },
      [syncPausedState]
    );

  /*
   * No logos.
   */
  if (clients.length === 0) {
    return null;
  }

  /*
   * Render a single real logo.
   *
   * IMPORTANT:
   * There is no "clone" parameter.
   * There are no duplicate logos.
   */
  const renderLogo = (
    project: Project,
    index: number
  ) => {
    const projectName = isArabic
      ? project.title_ar ||
        project.title_en ||
        "Project"
      : project.title_en ||
        project.title_ar ||
        "Project";

    return (
      <Link
        key={project.id}
        ref={(element) => {
          logoRefs.current[index] =
            element;
        }}
        href={localizePath(
          "/projects/" +
            project.slug,
          locale
        )}
        aria-label={projectName}
        onClick={handleLogoClick}
        className="
          absolute
          left-0
          top-1/2
          z-10
          flex
          h-24
          w-24
          shrink-0
          items-center
          justify-center
          rounded-full
          border-2
          border-brand-200/70
          bg-white
          p-1.5
          shadow-soft
          ring-2
          ring-brand-500/10
          transition-[border-color,box-shadow,filter]
          duration-300
          hover:border-brand-400
          hover:shadow-glow
          hover:ring-brand-500/25
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand-400
          focus-visible:ring-offset-2
          sm:h-26
          sm:w-26
          md:h-28
          md:w-28
        "
        style={{
          transform:
            "translate3d(0, -50%, 0)",
          willChange: "transform",
        }}
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-1
            rounded-full
            border
            border-dashed
            border-brand-200/60
          "
        />

        <span
          className="
            relative
            flex
            h-full
            w-full
            items-center
            justify-center
            overflow-hidden
            rounded-full
          "
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.logo || ""}
            alt=""
            draggable={false}
            loading="lazy"
            className="
              max-h-full
              max-w-full
              select-none
              object-contain
              transition-transform
              duration-300
              group-hover:scale-105
            "
          />
        </span>
      </Link>
    );
  };

  /*
   * One logo only:
   * no animation is necessary.
   */
  if (clients.length === 1) {
    return (
      <section className="container-site py-14">
        <h2
          className="
            mb-8
            text-center
            text-2xl
            font-extrabold
            text-ink-900
            sm:text-3xl
          "
        >
          {heading}
        </h2>

        <div
          className="
            flex
            justify-center
            py-6
          "
        >
          {renderLogo(
            clients[0],
            0
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="container-site py-14">
      <h2
        className="
          mb-8
          text-center
          text-2xl
          font-extrabold
          text-ink-900
          sm:text-3xl
        "
      >
        {heading}
      </h2>

      {/*
       * Important:
       *
       * - py-8 gives the shadow enough breathing room.
       * - overflow-x-hidden clips only horizontal overflow.
       * - touch-pan-y allows normal vertical page scrolling.
       * - No duplicated track.
       */}
      <div
        ref={viewportRef}
        dir="ltr"
        role="region"
        aria-label={heading}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerEnter={
          handlePointerEnter
        }
        onPointerLeave={
          handlePointerLeave
        }
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onPointerCancel={
          handlePointerCancel
        }
        className="
          relative
          h-40
          w-full
          overflow-x-hidden
          overflow-y-visible
          py-8
          outline-none
          touch-pan-y
          select-none
        "
        style={{
          touchAction: "pan-y",
        }}
      >
        {clients.map(
          (project, index) =>
            renderLogo(
              project,
              index
            )
        )}
      </div>
    </section>
  );
}