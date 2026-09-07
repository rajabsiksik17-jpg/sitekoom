"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
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

const MOBILE_SPEED = 38;
const TABLET_SPEED = 42;
const DESKTOP_SPEED = 45;

const MOBILE_GAP = 24;
const TABLET_GAP = 28;
const DESKTOP_GAP = 32;

export function ClientLogos({
  logos,
  locale,
  title,
}: ClientLogosProps) {
  const isAr = locale === "ar";

  const heading = title ?? {
    ar: "عملاؤنا وشركاؤنا",
    en: "Our Clients & Partners",
  };

  const headingText = isAr ? heading.ar : heading.en;

  /**
   * Remove duplicated projects.
   *
   * Every real project/logo exists only once.
   * There are NO cloned logo elements.
   */
  const unique = Array.from(
    new Map(
      logos
        .filter(
          (project) =>
            Boolean(project?.id) &&
            Boolean(project?.logo)
        )
        .map((project) => [project.id, project])
    ).values()
  );

  const viewportRef =
    useRef<HTMLDivElement | null>(null);

  const itemRefs =
    useRef<Array<HTMLAnchorElement | null>>([]);

  const positionsRef = useRef<number[]>([]);

  const animationFrameRef =
    useRef<number | null>(null);

  const lastTimeRef = useRef<number | null>(null);

  const containerWidthRef = useRef(0);
  const itemWidthRef = useRef(96);
  const spacingRef = useRef(120);

  const pointerDownRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] =
    useState(false);

  /**
   * Get responsive gap.
   */
  const getGap = useCallback(() => {
    if (typeof window === "undefined") {
      return DESKTOP_GAP;
    }

    if (window.innerWidth < 640) {
      return MOBILE_GAP;
    }

    if (window.innerWidth < 1024) {
      return TABLET_GAP;
    }

    return DESKTOP_GAP;
  }, []);

  /**
   * Get fixed movement speed for the current viewport.
   *
   * Speed is NOT related to logo count or logo length.
   */
  const getSpeed = useCallback(() => {
    if (typeof window === "undefined") {
      return DESKTOP_SPEED;
    }

    if (window.innerWidth < 640) {
      return MOBILE_SPEED;
    }

    if (window.innerWidth < 1024) {
      return TABLET_SPEED;
    }

    return DESKTOP_SPEED;
  }, []);

  /**
   * Measure and initialize all logo positions.
   *
   * IMPORTANT:
   * The logos are positioned independently.
   * There are no duplicated logo groups.
   */
  const initializePositions = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport || unique.length === 0) {
      return;
    }

    const containerWidth =
      viewport.getBoundingClientRect().width;

    if (containerWidth <= 0) {
      return;
    }

    const firstItem = itemRefs.current[0];

    const measuredItemWidth =
      firstItem?.getBoundingClientRect().width ??
      96;

    const gap = getGap();

    /**
     * Keep logos distributed across the available width.
     *
     * This is important when there are only a few clients.
     * It prevents all logos from being clustered on one side.
     */
    const minimumSpacing =
      measuredItemWidth + gap;

    const distributedSpacing =
      unique.length > 0
        ? containerWidth / unique.length
        : minimumSpacing;

    const spacing = Math.max(
      minimumSpacing,
      distributedSpacing
    );

    containerWidthRef.current = containerWidth;
    itemWidthRef.current = measuredItemWidth;
    spacingRef.current = spacing;

    const positions: number[] = [];

    if (isAr) {
      /**
       * Arabic / RTL:
       *
       * First logo starts on the RIGHT.
       *
       * Visual order:
       *
       * [1] [2] [3] [4]
       *  ↑
       * first logo
       *
       * They move toward the right.
       * Once a logo completely leaves the right side,
       * it is placed outside the LEFT side.
       */
      for (
        let index = 0;
        index < unique.length;
        index += 1
      ) {
        positions.push(
          containerWidth -
            measuredItemWidth -
            index * spacing
        );
      }
    } else {
      /**
       * English / LTR:
       *
       * First logo starts on the LEFT.
       *
       * Visual order:
       *
       * [1] [2] [3] [4]
       *  ↑
       * first logo
       *
       * They move toward the left.
       * Once a logo completely leaves the left side,
       * it is placed outside the RIGHT side.
       */
      for (
        let index = 0;
        index < unique.length;
        index += 1
      ) {
        positions.push(index * spacing);
      }
    }

    positionsRef.current = positions;

    /**
     * Apply positions directly to DOM.
     *
     * This avoids React re-rendering every animation frame.
     */
    itemRefs.current.forEach((item, index) => {
      if (!item) return;

      const position =
        positions[index] ?? 0;

      item.style.transform =
        `translate3d(${position}px, 0, 0)`;
    });

    setReady(true);
  }, [getGap, isAr, unique.length]);

  /**
   * Initial measurement.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      setReady(true);
      return;
    }

    /**
     * Give the browser one frame so dimensions are
     * available after the images/layout have rendered.
     */
    const frame = requestAnimationFrame(() => {
      initializePositions();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [initializePositions, unique.length]);

  /**
   * Recalculate after logo images load.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      return;
    }

    const images =
      viewportRef.current?.querySelectorAll(
        "img"
      );

    if (!images?.length) {
      return;
    }

    const handleLoad = () => {
      initializePositions();
    };

    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener(
          "load",
          handleLoad
        );
      }
    });

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          handleLoad
        );
      });
    };
  }, [initializePositions, unique.length]);

  /**
   * ResizeObserver.
   *
   * Rebuild positions when the screen/container changes.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    let resizeTimer:
      ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      setReady(false);

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(() => {
        initializePositions();
      }, 100);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    let observer: ResizeObserver | null = null;

    if (
      typeof ResizeObserver !== "undefined"
    ) {
      observer = new ResizeObserver(() => {
        handleResize();
      });

      observer.observe(viewport);
    }

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      observer?.disconnect();

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, [initializePositions, unique.length]);

  /**
   * Detect prefers-reduced-motion.
   */
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.matchMedia
    ) {
      return;
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const update = () => {
      setReducedMotion(mediaQuery.matches);
    };

    update();

    mediaQuery.addEventListener(
      "change",
      update
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        update
      );
    };
  }, []);

  /**
   * Main animation loop.
   *
   * Each logo moves independently.
   *
   * There is no duplicated DOM.
   * There is no CSS animation reset.
   * There is no translateX(50%).
   */
  useEffect(() => {
    if (
      unique.length <= 1 ||
      !ready ||
      reducedMotion
    ) {
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const delta = Math.min(
        time - lastTimeRef.current,
        50
      );

      lastTimeRef.current = time;

      if (
        !paused &&
        !pointerDownRef.current
      ) {
        const speed = getSpeed();

        const movement =
          (speed * delta) / 1000;

        const containerWidth =
          containerWidthRef.current;

        const itemWidth =
          itemWidthRef.current;

        const spacing =
          spacingRef.current;

        const positions =
          positionsRef.current;

        /**
         * RTL:
         *
         * First logo begins at the right.
         * Movement is toward the right.
         *
         * When it completely exits:
         *
         * RIGHT → OUT
         *
         * Then it is placed after the leftmost logo:
         *
         * OUT → LEFT
         *
         * This creates:
         *
         * 1 → 2 → 3 → 1 → 2 → 3
         */
        if (isAr) {
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            positions[index] += movement;
          }

          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            if (
              positions[index] >
              containerWidth
            ) {
              let leftmost =
                Number.POSITIVE_INFINITY;

              for (
                let i = 0;
                i < positions.length;
                i += 1
              ) {
                if (
                  i !== index &&
                  positions[i] <
                    leftmost
                ) {
                  leftmost =
                    positions[i];
                }
              }

              if (
                leftmost !==
                Number.POSITIVE_INFINITY
              ) {
                positions[index] =
                  leftmost -
                  spacing;
              }
            }
          }
        } else {
          /**
           * LTR:
           *
           * First logo begins at the left.
           * Movement is toward the left.
           *
           * When it completely exits:
           *
           * LEFT → OUT
           *
           * Then it is placed after the rightmost logo:
           *
           * OUT → RIGHT
           *
           * This creates:
           *
           * 1 → 2 → 3 → 1 → 2 → 3
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            positions[index] -= movement;
          }

          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            if (
              positions[index] +
                itemWidth <
              0
            ) {
              let rightmost =
                Number.NEGATIVE_INFINITY;

              for (
                let i = 0;
                i < positions.length;
                i += 1
              ) {
                if (
                  i !== index &&
                  positions[i] >
                    rightmost
                ) {
                  rightmost =
                    positions[i];
                }
              }

              if (
                rightmost !==
                Number.NEGATIVE_INFINITY
              ) {
                positions[index] =
                  rightmost +
                  spacing;
              }
            }
          }
        }

        /**
         * Write transforms directly.
         */
        itemRefs.current.forEach(
          (item, index) => {
            if (!item) return;

            const position =
              positions[index];

            if (
              typeof position !==
              "number"
            ) {
              return;
            }

            item.style.transform =
              `translate3d(${position}px, 0, 0)`;
          }
        );
      }

      animationFrameRef.current =
        requestAnimationFrame(animate);
    };

    animationFrameRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (
        animationFrameRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      animationFrameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [
    getSpeed,
    isAr,
    paused,
    ready,
    reducedMotion,
    unique.length,
  ]);

  /**
   * Pause while interacting.
   */
  const pause = useCallback(
    (_event?: ReactPointerEvent<HTMLDivElement>) => {
      pointerDownRef.current = true;
      setPaused(true);
    },
    []
  );

  /**
   * Resume after interaction.
   */
  const resume = useCallback(() => {
    pointerDownRef.current = false;

    window.setTimeout(() => {
      if (!pointerDownRef.current) {
        setPaused(false);
      }
    }, 350);
  }, []);

  /**
   * Keyboard accessibility.
   */
  const handleKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setPaused((value) => !value);
      }
    },
    []
  );

  /**
   * No logos.
   */
  if (unique.length === 0) {
    return null;
  }

  /**
   * Render logo.
   *
   * No duplicate rendering.
   */
  const renderLogo = (
    project: Project,
    index: number
  ) => {
    const projectTitle =
      isAr
        ? project.title_ar ||
          project.title_en ||
          "Project"
        : project.title_en ||
          project.title_ar ||
          "Project";

    const style: CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      transform:
        "translate3d(0, 0, 0)",
      willChange: "transform",
    };

    return (
      <Link
        key={project.id}
        ref={(element) => {
          itemRefs.current[index] =
            element;
        }}
        href={localizePath(
          `/projects/${project.slug}`,
          locale
        )}
        aria-label={projectTitle}
        style={style}
        className="
          group
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
          transition-[border-color,box-shadow,transform]
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
      >
        {/* Premium inner ring */}
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

        {/* Logo container */}
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
            src={project.logo!}
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

  /**
   * Only one logo.
   */
  if (unique.length === 1) {
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
          {headingText}
        </h2>

        <div className="flex justify-center">
          {renderLogo(unique[0], 0)}
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
        {headingText}
      </h2>

      <div
        ref={viewportRef}
        dir="ltr"
        role="region"
        aria-label={headingText}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerCancel={resume}
        onPointerLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        className="
          relative
          h-24
          w-full
          overflow-hidden
          py-0
          outline-none
          sm:h-26
          md:h-28
        "
      >
        {unique.map((project, index) =>
          renderLogo(project, index)
        )}
      </div>
    </section>
  );
}