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
   * Only real unique projects.
   * No cloned logos are ever created.
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

  const positionsRef =
    useRef<number[]>([]);

  const spacingRef =
    useRef(0);

  const logoWidthRef =
    useRef(0);

  const viewportWidthRef =
    useRef(0);

  const speedRef =
    useRef(DESKTOP_SPEED);

  const animationFrameRef =
    useRef<number | null>(null);

  const lastFrameTimeRef =
    useRef<number | null>(null);

  const initializedRef =
    useRef(false);

  /*
   * IMPORTANT:
   * Store the last REAL WIDTH.
   *
   * Mobile browsers can fire resize events while
   * the address bar is expanding/collapsing during
   * vertical page scrolling.
   *
   * We must NOT reset the slider in that situation.
   */
  const lastMeasuredWidthRef =
    useRef(0);

  const pausedRef =
    useRef(false);

  const hoveredRef =
    useRef(false);

  const touchingRef =
    useRef(false);

  const draggingRef =
    useRef(false);

  const horizontalDragRef =
    useRef(false);

  const dragMovedRef =
    useRef(false);

  const lastPointerXRef =
    useRef(0);

  const pointerIdRef =
    useRef<number | null>(null);

  const reducedMotionRef =
    useRef(false);

  /*
   * Get responsive speed.
   */
  const getSpeed = useCallback(() => {
    if (
      typeof window === "undefined"
    ) {
      return DESKTOP_SPEED;
    }

    if (
      window.innerWidth <
      MOBILE_BREAKPOINT
    ) {
      return MOBILE_SPEED;
    }

    if (
      window.innerWidth <
      TABLET_BREAKPOINT
    ) {
      return TABLET_SPEED;
    }

    return DESKTOP_SPEED;
  }, []);

  /*
   * Apply one logo position.
   *
   * No opacity.
   * No fade.
   * No transition on transform.
   *
   * This is important so a wrapped logo enters
   * immediately from the opposite edge.
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
   * Apply every logo position.
   */
  const applyAllPositions =
    useCallback(() => {
      positionsRef.current.forEach(
        (x, index) => {
          const element =
            logoRefs.current[index];

          if (!element) {
            return;
          }

          applyPosition(
            element,
            x
          );
        }
      );
    }, [applyPosition]);

  /*
   * Initialize the slider.
   *
   * IMPORTANT:
   * This should only happen when the actual
   * horizontal width changes, NOT simply because
   * the mobile browser fired a resize during scroll.
   */
  const initializePositions =
    useCallback(
      (
        force = false
      ) => {
        const viewport =
          viewportRef.current;

        if (
          !viewport ||
          clients.length === 0
        ) {
          return;
        }

        const viewportWidth =
          viewport.getBoundingClientRect()
            .width;

        if (
          viewportWidth <= 0
        ) {
          return;
        }

        /*
         * Do not reset the animation if the width
         * did not actually change.
         *
         * This prevents the mobile scroll restart bug.
         */
        if (
          !force &&
          initializedRef.current &&
          Math.abs(
            viewportWidth -
              lastMeasuredWidthRef.current
          ) < 1
        ) {
          return;
        }

        const firstLogo =
          logoRefs.current[0];

        if (!firstLogo) {
          return;
        }

        const logoWidth =
          firstLogo.getBoundingClientRect()
            .width;

        if (
          logoWidth <= 0
        ) {
          return;
        }

        const speed =
          getSpeed();

        let minimumGap = 24;

        if (
          window.innerWidth >=
          TABLET_BREAKPOINT
        ) {
          minimumGap = 32;
        } else if (
          window.innerWidth >=
          MOBILE_BREAKPOINT
        ) {
          minimumGap = 28;
        }

        /*
         * When there are only a few real logos,
         * spread them across the available space.
         *
         * Still NO duplicates.
         */
        const spacing =
          Math.max(
            logoWidth +
              minimumGap,
            viewportWidth /
              clients.length
          );

        viewportWidthRef.current =
          viewportWidth;

        logoWidthRef.current =
          logoWidth;

        spacingRef.current =
          spacing;

        speedRef.current =
          speed;

        lastMeasuredWidthRef.current =
          viewportWidth;

        positionsRef.current =
          clients.map(
            (_, index) => {
              if (isArabic) {
                /*
                 * Arabic:
                 *
                 * A   B   C
                 * ← ← ←
                 *
                 * First logo starts from the right.
                 */
                return (
                  viewportWidth -
                  logoWidth -
                  index *
                    spacing
                );
              }

              /*
               * English:
               *
               * A   B   C
               * → → →
               *
               * First logo starts from the left.
               */
              return (
                index * spacing
              );
            }
          );

        applyAllPositions();

        initializedRef.current =
          true;

        lastFrameTimeRef.current =
          performance.now();
      },
      [
        clients,
        getSpeed,
        isArabic,
        applyAllPositions,
      ]
    );

  /*
   * Keep pause state synchronized.
   */
  const syncPausedState =
    useCallback(() => {
      pausedRef.current =
        hoveredRef.current ||
        touchingRef.current ||
        draggingRef.current;
    }, []);

  /*
   * Move logos.
   *
   * Every logo is an independent real element.
   */
  const moveLogos =
    useCallback(
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
         * ============================
         * RTL / ARABIC
         * ============================
         *
         * Move right -> left.
         */
        if (isArabic) {
          for (
            let index = 0;
            index <
            positions.length;
            index += 1
          ) {
            positions[index] -=
              delta;
          }

          /*
           * If a logo completely leaves
           * the LEFT edge:
           *
           * put the SAME logo immediately
           * after the right-most logo.
           *
           * No clone.
           * No fade.
           * No reset.
           */
          for (
            let index = 0;
            index <
            positions.length;
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
                i <
                positions.length;
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
                rightMost +
                spacing;
            }
          }

          return;
        }

        /*
         * ============================
         * LTR / ENGLISH
         * ============================
         *
         * Move left -> right.
         */
        for (
          let index = 0;
          index <
          positions.length;
          index += 1
        ) {
          positions[index] +=
            delta;
        }

        /*
         * If a logo completely leaves
         * the RIGHT edge:
         *
         * put the SAME logo immediately
         * before the left-most logo.
         */
        for (
          let index = 0;
          index <
          positions.length;
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
              i <
              positions.length;
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
              leftMost -
              spacing;
          }
        }
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

    const updateReducedMotion =
      () => {
        reducedMotionRef.current =
          mediaQuery.matches;
      };

    updateReducedMotion();

    mediaQuery.addEventListener(
      "change",
      updateReducedMotion
    );

    let mounted = true;

    const frame = (
      now: number
    ) => {
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

      /*
       * Cap elapsed time.
       *
       * This prevents a huge jump if the browser
       * temporarily pauses rendering.
       */
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

        if (
          delta > 0
        ) {
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

      animationFrameRef.current =
        null;

      mediaQuery.removeEventListener(
        "change",
        updateReducedMotion
      );
    };
  }, [
    clients.length,
    moveLogos,
  ]);

  /*
   * Initial setup.
   *
   * ResizeObserver is intentionally used instead
   * of blindly reacting to every window resize.
   *
   * On mobile scrolling, the browser may change
   * viewport UI dimensions. If horizontal width
   * stays the same, NOTHING is reset.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    const viewport =
      viewportRef.current;

    if (!viewport) {
      return;
    }

    const initialize =
      (force = false) => {
        initializePositions(
          force
        );
      };

    const initialTimer =
      window.setTimeout(() => {
        initialize(true);
      }, 100);

    const resizeObserver =
      new ResizeObserver(
        (entries) => {
          const entry =
            entries[0];

          if (!entry) {
            return;
          }

          const width =
            entry.contentRect.width;

          /*
           * ONLY reinitialize when horizontal
           * width really changes.
           *
           * Vertical mobile scrolling will not
           * reset the slider.
           */
          if (
            Math.abs(
              width -
                lastMeasuredWidthRef.current
            ) >= 1
          ) {
            initialize(false);
          }
        }
      );

    resizeObserver.observe(
      viewport
    );

    return () => {
      window.clearTimeout(
        initialTimer
      );

      resizeObserver.disconnect();
    };
  }, [
    clients.length,
    initializePositions,
  ]);

  /*
   * Reinitialize only after an image actually loads.
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

    const handleImageLoad =
      () => {
        /*
         * Force measurement because the actual
         * logo dimensions may have changed.
         */
        initializedRef.current =
          false;

        initializePositions(
          true
        );
      };

    images.forEach(
      (image) => {
        if (
          image.complete
        ) {
          return;
        }

        image.addEventListener(
          "load",
          handleImageLoad
        );
      }
    );

    return () => {
      images.forEach(
        (image) => {
          image.removeEventListener(
            "load",
            handleImageLoad
          );
        }
      );
    };
  }, [
    clients.length,
    initializePositions,
  ]);

  /*
   * Desktop mouse enter.
   */
  const handlePointerEnter =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (
          event.pointerType ===
          "mouse"
        ) {
          hoveredRef.current =
            true;

          syncPausedState();
        }
      },
      [syncPausedState]
    );

  /*
   * Desktop mouse leave.
   */
  const handlePointerLeave =
    useCallback(
      (
        event: React.PointerEvent<HTMLDivElement>
      ) => {
        if (
          event.pointerType ===
          "mouse"
        ) {
          hoveredRef.current =
            false;

          syncPausedState();
        }
      },
      [syncPausedState]
    );

  /*
   * Pointer down.
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
          event.pointerType ===
          "touch"
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
          // Ignore unsupported pointer capture.
        }
      },
      [syncPausedState]
    );

  /*
   * Pointer move.
   *
   * Vertical movement is left to the browser.
   * Horizontal movement becomes slider dragging.
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

        /*
         * Do not lock the gesture immediately.
         * This allows normal vertical page scrolling.
         */
        if (
          !horizontalDragRef.current
        ) {
          if (
            Math.abs(deltaX) <
            5
          ) {
            return;
          }

          horizontalDragRef.current =
            true;

          dragMovedRef.current =
            true;
        }

        event.preventDefault();

        const positions =
          positionsRef.current;

        const viewportWidth =
          viewportWidthRef.current;

        const logoWidth =
          logoWidthRef.current;

        const spacing =
          spacingRef.current;

        /*
         * Drag follows the finger.
         */
        for (
          let index = 0;
          index <
          positions.length;
          index += 1
        ) {
          positions[index] +=
            deltaX;
        }

        /*
         * Keep wrapping seamless while dragging.
         */
        if (isArabic) {
          for (
            let index = 0;
            index <
            positions.length;
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
                i <
                positions.length;
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
                rightMost +
                spacing;
            }
          }

          /*
           * Also support dragging toward the
           * opposite direction.
           */
          for (
            let index = 0;
            index <
            positions.length;
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
                i <
                positions.length;
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
                leftMost -
                spacing;
            }
          }
        } else {
          for (
            let index = 0;
            index <
            positions.length;
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
                i <
                positions.length;
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
                leftMost -
                spacing;
            }
          }

          for (
            let index = 0;
            index <
            positions.length;
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
                i <
                positions.length;
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
                rightMost +
                spacing;
            }
          }
        }

        applyAllPositions();
      },
      [
        applyAllPositions,
        isArabic,
      ]
    );

  /*
   * Pointer up.
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

        syncPausedState();

        try {
          event.currentTarget.releasePointerCapture(
            event.pointerId
          );
        } catch {
          // Ignore unsupported pointer capture.
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
          // Ignore unsupported pointer capture.
        }
      },
      [syncPausedState]
    );

  /*
   * Prevent navigation after an actual drag.
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
   * Keyboard accessibility.
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
   * Render one REAL logo.
   *
   * There is intentionally no clone argument.
   */
  const renderLogo = (
    project: Project,
    index: number
  ) => {
    const projectName =
      isArabic
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
          group
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
          transition-[border-color,box-shadow,ring-color]
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
          willChange:
            "transform",
          opacity: 1,
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
   * Single logo.
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
            px-4
            py-8
          "
        >
          {/*
            The single logo is rendered normally.
            It does not need slider positioning.
          */}
          <div
            className="
              flex
              h-28
              w-28
              items-center
              justify-center
            "
          >
            <Link
              href={localizePath(
                "/projects/" +
                  clients[0].slug,
                locale
              )}
              aria-label={
                isArabic
                  ? clients[0].title_ar ||
                    clients[0].title_en ||
                    "Project"
                  : clients[0].title_en ||
                    clients[0].title_ar ||
                    "Project"
              }
              className="
                group
                relative
                flex
                h-24
                w-24
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
                transition-[border-color,box-shadow,ring-color]
                duration-300
                hover:border-brand-400
                hover:shadow-glow
                hover:ring-brand-500/25
                sm:h-26
                sm:w-26
                md:h-28
                md:w-28
              "
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
                  src={
                    clients[0].logo ||
                    ""
                  }
                  alt=""
                  draggable={false}
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
          </div>
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
       * Slider viewport.
       *
       * IMPORTANT:
       * - Extra vertical space for shadows.
       * - No horizontal scrollbar.
       * - Vertical page scrolling remains native.
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
          overflow-hidden
          py-8
          outline-none
          select-none
        "
        style={{
          touchAction:
            "pan-y",
        }}
      >
        {/*
         * Real logos only.
         */
        {clients.map(
          (project, index) =>
            renderLogo(
              project,
              index
            )
        )}

        {/*
         * ====================================
         * LEFT CLOUD / FOG EDGE
         * ====================================
         *
         * White gradient with blur creates a
         * soft cloudy entrance/exit.
         *
         * It does NOT affect the movement.
         */
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-y-0
            left-0
            z-30
            w-16
            bg-gradient-to-r
            from-white
            via-white/90
            to-transparent
            blur-[1px]
            sm:w-24
            md:w-32
          "
        />

        {/*
         * ====================================
         * RIGHT CLOUD / FOG EDGE
         * ====================================
         */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-y-0
            right-0
            z-30
            w-16
            bg-gradient-to-l
            from-white
            via-white/90
            to-transparent
            blur-[1px]
            sm:w-24
            md:w-32
          "
        />

        {/*
         * Very soft additional glow at the
         * edges to make the transition look
         * more like white mist/cloud.
         */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-y-4
            left-0
            z-20
            w-10
            rounded-full
            bg-white/70
            blur-xl
            sm:w-16
            md:w-20
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-y-4
            right-0
            z-20
            w-10
            rounded-full
            bg-white/70
            blur-xl
            sm:w-16
            md:w-20
          "
        />
      </div>
    </section>
  );
}