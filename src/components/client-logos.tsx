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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const groupWidthRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);

  /**
   * Fixed movement speed.
   *
   * The speed does NOT depend on the number or length
   * of logos. The group width only determines how long
   * one complete cycle takes.
   */
  const SPEED_PX_PER_SECOND = 45;

  /**
   * Deduplicate projects by ID and ignore projects
   * without a logo.
   */
  const unique = Array.from(
    new Map(
      logos
        .filter((project) => project?.id && project?.logo)
        .map((project) => [project.id, project])
    ).values()
  );

  /**
   * Measure the exact width of the first logo group.
   *
   * This is important because the animation must travel
   * exactly one complete group width before restarting.
   */
  const measureGroup = useCallback(() => {
    const group = groupRef.current;

    if (!group) return;

    const width = group.getBoundingClientRect().width;

    if (width > 0) {
      groupWidthRef.current = width;

      /**
       * For RTL we start from the second copy.
       * For LTR we start from the first copy.
       */
      if (isAr) {
        offsetRef.current = -width;
      } else {
        offsetRef.current = 0;
      }

      setReady(true);
    }
  }, [isAr]);

  /**
   * Measure initially and whenever the viewport changes.
   */
  useEffect(() => {
    if (unique.length <= 1) return;

    measureGroup();

    const handleResize = () => {
      measureGroup();
    };

    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | null = null;

    if (groupRef.current && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        measureGroup();
      });

      resizeObserver.observe(groupRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [measureGroup, unique.length]);

  /**
   * Infinite marquee animation.
   *
   * Instead of CSS translateX(50%), we use the actual
   * measured width of the first group.
   *
   * This prevents the visible jump that happened before.
   */
  useEffect(() => {
    if (unique.length <= 1 || !ready) return;

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const delta = Math.min(
        time - lastTimeRef.current,
        50
      );

      lastTimeRef.current = time;

      if (!paused) {
        const distance =
          (SPEED_PX_PER_SECOND * delta) / 1000;

        const groupWidth = groupWidthRef.current;

        if (groupWidth > 0) {
          if (isAr) {
            /**
             * RTL:
             * Start at -groupWidth and move toward 0.
             *
             * Once reaching 0, immediately move back to
             * -groupWidth. Since both groups are identical,
             * this reset is invisible.
             */
            offsetRef.current += distance;

            if (offsetRef.current >= 0) {
              offsetRef.current -= groupWidth;
            }
          } else {
            /**
             * LTR:
             * Start at 0 and move toward -groupWidth.
             */
            offsetRef.current -= distance;

            if (offsetRef.current <= -groupWidth) {
              offsetRef.current += groupWidth;
            }
          }

          if (groupRef.current?.parentElement) {
            const track = groupRef.current.parentElement;

            track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
          }
        }
      }

      animationFrameRef.current =
        requestAnimationFrame(animate);
    };

    animationFrameRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = null;
      lastTimeRef.current = null;
    };
  }, [isAr, paused, ready, unique.length]);

  /**
   * Pause interaction.
   */
  const pause = useCallback(() => {
    setPaused(true);
  }, []);

  /**
   * Resume interaction.
   */
  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  /**
   * Keyboard accessibility.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        setPaused((current) => !current);
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
    const projectTitle =
      project.title_ar ||
      project.title_en ||
      "Project";

    return (
      <Link
        key={`${project.id}-${duplicate ? "duplicate" : "original"}-${index}`}
        href={localizePath(
          `/projects/${project.slug}`,
          locale
        )}
        aria-label={projectTitle}
        tabIndex={duplicate ? -1 : 0}
        aria-hidden={duplicate ? true : undefined}
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
          className="
            pointer-events-none
            absolute
            inset-1
            rounded-full
            border
            border-dashed
            border-brand-200/60
          "
          aria-hidden="true"
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
            loading={duplicate ? "eager" : "lazy"}
            draggable={false}
            className="
              max-h-full
              max-w-full
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
   * Only one logo:
   * No ticker is necessary.
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

  /**
   * Two identical groups.
   *
   * IMPORTANT:
   * We do not deduplicate this second copy because it is
   * only a technical clone required for the seamless loop.
   *
   * It is aria-hidden and not keyboard-focusable.
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
        {headingText}
      </h2>

      <div
        ref={containerRef}
        dir={isAr ? "rtl" : "ltr"}
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
          w-full
          overflow-hidden
          py-2
          outline-none
        "
      >
        {/*
          IMPORTANT:
          No white gradients here.

          The previous implementation used two absolute
          white gradient layers on the sides. Those layers
          caused the visible white bars/lines, especially
          in Arabic RTL.

          They are intentionally removed.
        */}

        <div
          className="
            flex
            w-max
            items-center
            will-change-transform
            gap-6
            sm:gap-7
            md:gap-8
          "
          style={{
            transform: ready
              ? `translate3d(${offsetRef.current}px, 0, 0)`
              : isAr
                ? "translate3d(-100%, 0, 0)"
                : "translate3d(0, 0, 0)",
          }}
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
            {unique.map((project, index) =>
              logoItem(project, index, false)
            )}
          </div>

          {/* SECOND IDENTICAL GROUP */}
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
            {unique.map((project, index) =>
              logoItem(project, index, true)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}