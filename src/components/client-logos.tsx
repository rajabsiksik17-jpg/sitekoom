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

const MOBILE_GAP = 24;
const TABLET_GAP = 28;
const DESKTOP_GAP = 32;

const MOBILE_SPEED = 38;
const TABLET_SPEED = 42;
const DESKTOP_SPEED = 45;

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

  /*
   * Remove duplicate projects.
   *
   * Each actual client/project appears only once
   * in the original data.
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

  const groupRef =
    useRef<HTMLDivElement | null>(null);

  const trackRef =
    useRef<HTMLDivElement | null>(null);

  const [loopDistance, setLoopDistance] =
    useState(0);

  const [paused, setPaused] = useState(false);

  const [speed, setSpeed] =
    useState(DESKTOP_SPEED);

  const pointerDownRef =
    useRef(false);

  /**
   * Return the responsive gap.
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
   * Return the responsive animation speed.
   *
   * Speed is fixed per viewport.
   * It does NOT depend on the number of logos.
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
   * Measure the exact width of the first group.
   *
   * The animation moves exactly:
   *
   * group width + gap between groups
   *
   * This makes the second copy line up perfectly
   * with the first copy when the animation loops.
   */
  const measureLoop = useCallback(() => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const width =
      group.getBoundingClientRect().width;

    if (!width || width <= 0) {
      return;
    }

    const gap = getGap();

    setLoopDistance(width + gap);
  }, [getGap]);

  /**
   * Measure initial dimensions.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      return;
    }

    const update = () => {
      measureLoop();
      setSpeed(getSpeed());
    };

    const frame =
      window.requestAnimationFrame(update);

    window.addEventListener(
      "resize",
      update
    );

    let observer:
      | ResizeObserver
      | null = null;

    if (
      typeof ResizeObserver !==
        "undefined" &&
      groupRef.current
    ) {
      observer = new ResizeObserver(() => {
        update();
      });

      observer.observe(groupRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        update
      );

      observer?.disconnect();
    };
  }, [
    getSpeed,
    measureLoop,
    unique.length,
  ]);

  /**
   * Re-measure after images finish loading.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      return;
    }

    const images =
      groupRef.current?.querySelectorAll(
        "img"
      );

    if (!images?.length) {
      measureLoop();
      return;
    }

    const handleLoad = () => {
      measureLoop();
    };

    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener(
          "load",
          handleLoad
        );
      }
    });

    measureLoop();

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          handleLoad
        );
      });
    };
  }, [
    measureLoop,
    unique.length,
  ]);

  /**
   * Pause the ticker.
   *
   * No event argument is required.
   *
   * Therefore this function can safely be used with:
   * onPointerDown
   * onTouchStart
   * onMouseEnter
   * etc.
   */
  const pause = useCallback(() => {
    pointerDownRef.current = true;
    setPaused(true);
  }, []);

  /**
   * Resume the ticker.
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
   * Pointer handlers.
   */
  const handlePointerDown =
    useCallback(() => {
      pause();
    }, [pause]);

  const handlePointerUp =
    useCallback(() => {
      resume();
    }, [resume]);

  /**
   * Touch handlers.
   *
   * These are intentionally separate from pointer handlers
   * so TypeScript never mixes PointerEvent and TouchEvent.
   */
  const handleTouchStart =
    useCallback(() => {
      pause();
    }, [pause]);

  const handleTouchEnd =
    useCallback(() => {
      resume();
    }, [resume]);

  /**
   * Keyboard accessibility.
   */
  const handleKeyDown =
    useCallback(
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
   * Render one logo.
   */
  const logoItem = (
    project: Project,
    index: number,
    duplicate = false
  ) => {
    const projectTitle = isAr
      ? project.title_ar ||
        project.title_en ||
        "Project"
      : project.title_en ||
        project.title_ar ||
        "Project";

    return (
      <Link
        key={`${duplicate ? "clone" : "original"}-${project.id}-${index}`}
        href={localizePath(
          `/projects/${project.slug}`,
          locale
        )}
        aria-label={projectTitle}
        aria-hidden={
          duplicate ? true : undefined
        }
        tabIndex={
          duplicate ? -1 : undefined
        }
        className="
          group
          relative
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
          transition-all
          duration-300
          hover:-translate-y-1
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

        {/* Logo */}
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
            loading={
              duplicate
                ? "eager"
                : "lazy"
            }
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
          {logoItem(unique[0], 0)}
        </div>
      </section>
    );
  }

  /*
   * Two identical groups.
   *
   * This is ONLY a technical clone for seamless animation.
   * The data itself remains deduplicated.
   */
  const firstGroup = unique;
  const secondGroup = unique;

  /**
   * Animation duration is calculated from:
   *
   * exact loop distance / fixed speed
   *
   * Therefore the visual speed remains constant.
   */
  const animationDuration =
    loopDistance > 0
      ? `${loopDistance / speed}s`
      : "30s";

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
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="
          relative
          w-full
          overflow-hidden
          py-3
          outline-none
          touch-pan-y
        "
      >
        <div
          ref={trackRef}
          className="
            client-logos-track
            flex
            w-max
            items-center
            gap-6
            will-change-transform
            sm:gap-7
            md:gap-8
          "
          style={
            {
              "--logos-distance": `${loopDistance}px`,
              "--logos-duration": animationDuration,
              animationPlayState: paused
                ? "paused"
                : "running",
            } as React.CSSProperties
          }
        >
          {/* FIRST GROUP */}
          <div
            ref={groupRef}
            className="
              flex
              shrink-0
              items-center
              gap-6
              sm:gap-7
              md:gap-8
            "
          >
            {firstGroup.map(
              (project, index) =>
                logoItem(
                  project,
                  index,
                  false
                )
            )}
          </div>

          {/* SECOND GROUP */}
          <div
            className="
              flex
              shrink-0
              items-center
              gap-6
              sm:gap-7
              md:gap-8
            "
            aria-hidden="true"
          >
            {secondGroup.map(
              (project, index) =>
                logoItem(
                  project,
                  index,
                  true
                )
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .client-logos-track {
          animation-name: client-logos-scroll;
          animation-duration: var(--logos-duration);
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
        }

        @keyframes client-logos-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(
              calc(-1 * var(--logos-distance)),
              0,
              0
            );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .client-logos-track {
            animation: none !important;
            transform: translate3d(0, 0, 0) !important;
          }
        }
      `}</style>
    </section>
  );
}