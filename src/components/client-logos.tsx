"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
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

const DESKTOP_GAP = 32;
const TABLET_GAP = 28;
const MOBILE_GAP = 24;

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
   * Keep only real unique projects that have logos.
   */
  const clients = Array.from(
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

  const viewportRef =
    useRef<HTMLDivElement | null>(null);

  const itemRefs =
    useRef<Array<HTMLAnchorElement | null>>([]);

  const positionsRef =
    useRef<number[]>([]);

  const animationFrameRef =
    useRef<number | null>(null);

  const lastTimeRef =
    useRef<number | null>(null);

  const containerWidthRef =
    useRef(0);

  const itemWidthRef =
    useRef(96);

  const spacingRef =
    useRef(120);

  const [ready, setReady] =
    useState(false);

  const [paused, setPaused] =
    useState(false);

  const [reducedMotion, setReducedMotion] =
    useState(false);

  /*
   * Get responsive logo gap.
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

  /*
   * Get responsive movement speed.
   *
   * The speed is fixed and does not depend
   * on the number of logos.
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

  /*
   * Position every logo across the viewport.
   *
   * There is intentionally NO second copy of the logos.
   */
  const initialize = useCallback(() => {
    const viewport = viewportRef.current;

    if (!viewport || clients.length === 0) {
      return;
    }

    const viewportWidth =
      viewport.getBoundingClientRect().width;

    if (viewportWidth <= 0) {
      return;
    }

    const firstLogo =
      itemRefs.current[0];

    const logoWidth =
      firstLogo?.getBoundingClientRect().width ??
      96;

    const gap = getGap();

    /*
     * Make sure there is always enough distance
     * between logos.
     */
    const minimumSpacing =
      logoWidth + gap;

    /*
     * When there are only a few logos, distribute
     * them across the available width instead of
     * putting all of them next to each other.
     */
    const distributedSpacing =
      clients.length > 1
        ? viewportWidth / clients.length
        : minimumSpacing;

    const spacing = Math.max(
      minimumSpacing,
      distributedSpacing
    );

    containerWidthRef.current =
      viewportWidth;

    itemWidthRef.current =
      logoWidth;

    spacingRef.current =
      spacing;

    const positions: number[] = [];

    if (isArabic) {
      /*
       * RTL:
       *
       * First logo starts from the RIGHT.
       *
       * Example:
       *
       * | C | B | A |
       *             ↑
       *            right
       */
      for (
        let index = 0;
        index < clients.length;
        index += 1
      ) {
        positions.push(
          viewportWidth -
            logoWidth -
            index * spacing
        );
      }
    } else {
      /*
       * LTR:
       *
       * First logo starts from the LEFT.
       *
       * Example:
       *
       * | A | B | C |
       * ↑
       * left
       */
      for (
        let index = 0;
        index < clients.length;
        index += 1
      ) {
        positions.push(
          index * spacing
        );
      }
    }

    positionsRef.current =
      positions;

    /*
     * Apply initial positions.
     */
    itemRefs.current.forEach(
      (item, index) => {
        if (!item) {
          return;
        }

        const position =
          positions[index] ?? 0;

        item.style.transform =
          `translate3d(${position}px, 0, 0)`;
      }
    );

    setReady(true);
  }, [
    clients.length,
    getGap,
    isArabic,
  ]);

  /*
   * Initialize when the component mounts.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      setReady(true);
      return;
    }

    const frame =
      window.requestAnimationFrame(() => {
        initialize();
      });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    clients.length,
    initialize,
  ]);

  /*
   * Recalculate after resizing.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    let resizeTimer:
      ReturnType<typeof setTimeout> | null =
      null;

    const handleResize = () => {
      setReady(false);

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(() => {
        initialize();
      }, 100);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );

      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, [
    clients.length,
    initialize,
  ]);

  /*
   * Recalculate after logos finish loading.
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

    const handleLoad = () => {
      initialize();
    };

    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener(
          "load",
          handleLoad
        );
      }
    });

    initialize();

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          handleLoad
        );
      });
    };
  }, [
    clients.length,
    initialize,
  ]);

  /*
   * Respect prefers-reduced-motion.
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
      setReducedMotion(
        mediaQuery.matches
      );
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

  /*
   * REAL infinite ticker.
   *
   * Every logo is a single element.
   *
   * When a logo completely leaves the viewport,
   * it is moved to the opposite side.
   *
   * No duplicate DOM.
   * No second logo group.
   * No CSS animation reset.
   */
  useEffect(() => {
    if (
      clients.length <= 1 ||
      !ready ||
      reducedMotion
    ) {
      return;
    }

    const animate = (time: number) => {
      if (
        lastTimeRef.current === null
      ) {
        lastTimeRef.current =
          time;
      }

      const elapsed =
        Math.min(
          time -
            lastTimeRef.current,
          50
        );

      lastTimeRef.current =
        time;

      if (!paused) {
        const speed =
          getSpeed();

        const movement =
          (speed * elapsed) /
          1000;

        const viewportWidth =
          containerWidthRef.current;

        const logoWidth =
          itemWidthRef.current;

        const spacing =
          spacingRef.current;

        const positions =
          positionsRef.current;

        if (isArabic) {
          /*
           * RTL movement.
           *
           * Logos move toward the RIGHT.
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            positions[index] +=
              movement;
          }

          /*
           * Find logos that have completely
           * left the RIGHT side.
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
          /*
           * LTR movement.
           *
           * Logos move toward the LEFT.
           */
          for (
            let index = 0;
            index < positions.length;
            index += 1
          ) {
            positions[index] -=
              movement;
          }

          /*
           * Find logos that have completely
           * left the LEFT side.
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

        /*
         * Update the actual DOM positions
         * without React re-rendering every frame.
         */
        itemRefs.current.forEach(
          (item, index) => {
            if (!item) {
              return;
            }

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
        window.requestAnimationFrame(
          animate
        );
    };

    animationFrameRef.current =
      window.requestAnimationFrame(
        animate
      );

    return () => {
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

      lastTimeRef.current =
        null;
    };
  }, [
    clients.length,
    getSpeed,
    isArabic,
    paused,
    ready,
    reducedMotion,
  ]);

  /*
   * Pause.
   */
  const pause = useCallback(() => {
    setPaused(true);
  }, []);

  /*
   * Resume.
   */
  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  /*
   * Keyboard control.
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

        setPaused(
          (current) => !current
        );
      }
    },
    []
  );

  /*
   * No clients.
   */
  if (clients.length === 0) {
    return null;
  }

  /*
   * Single client.
   */
  if (clients.length === 1) {
    const project =
      clients[0];

    const projectName =
      isArabic
        ? project.title_ar ||
          project.title_en ||
          "Project"
        : project.title_en ||
          project.title_ar ||
          "Project";

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

        <div className="flex justify-center">
          <Link
            href={localizePath(
              "/projects/" +
                project.slug,
              locale
            )}
            aria-label={projectName}
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
              transition-all
              duration-300
              hover:-translate-y-1
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
                  project.logo || ""
                }
                alt=""
                draggable={false}
                className="
                  max-h-full
                  max-w-full
                  select-none
                  object-contain
                "
              />
            </span>
          </Link>
        </div>
      </section>
    );
  }

  /*
   * Multiple clients.
   */
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
        ref={viewportRef}
        dir="ltr"
        role="region"
        aria-label={heading}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerCancel={resume}
        onPointerLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        onTouchCancel={resume}
        className="
          relative
          h-24
          w-full
          overflow-hidden
          outline-none
          touch-pan-y
          sm:h-26
          md:h-28
        "
      >
        {clients.map(
          (project, index) => {
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
                  itemRefs.current[
                    index
                  ] = element;
                }}
                href={localizePath(
                  "/projects/" +
                    project.slug,
                  locale
                )}
                aria-label={
                  projectName
                }
                className="
                  group
                  absolute
                  left-0
                  top-0
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
                  transition-[border-color,box-shadow]
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
                      project.logo || ""
                    }
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
          }
        )}
      </div>
    </section>
  );
}