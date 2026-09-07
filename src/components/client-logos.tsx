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

const LOGO_SIZE = 96;
const LOGO_GAP = 24;
const MOBILE_SPEED = 38;
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

  /**
   * Remove duplicated projects.
   *
   * The same project/logo can only exist once
   * in the original source list.
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

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [loopDistance, setLoopDistance] =
    useState<number>(0);

  const [paused, setPaused] = useState(false);

  const pointerDownRef = useRef(false);

  /**
   * Measure the exact distance between the beginning
   * of group #1 and the beginning of group #2.
   *
   * This is the critical value for a seamless loop.
   */
  const measureLoop = useCallback(() => {
    const group = groupRef.current;

    if (!group) return;

    const width = group.getBoundingClientRect().width;

    if (!width) return;

    /**
     * The second group starts after:
     *
     * group width + LOGO_GAP
     *
     * because the two groups are separated by the same
     * gap used between logos.
     */
    const distance = width + LOGO_GAP;

    setLoopDistance(distance);
  }, []);

  useEffect(() => {
    if (unique.length <= 1) return;

    measureLoop();

    const resize = () => {
      measureLoop();
    };

    window.addEventListener("resize", resize);

    let observer: ResizeObserver | null = null;

    if (
      typeof ResizeObserver !== "undefined" &&
      groupRef.current
    ) {
      observer = new ResizeObserver(() => {
        measureLoop();
      });

      observer.observe(groupRef.current);
    }

    return () => {
      window.removeEventListener("resize", resize);
      observer?.disconnect();
    };
  }, [measureLoop, unique.length]);

  /**
   * Recalculate after images have loaded.
   *
   * This prevents the loop width from being measured
   * before the logos finish loading.
   */
  useEffect(() => {
    if (unique.length <= 1) return;

    const images =
      groupRef.current?.querySelectorAll("img");

    if (!images?.length) {
      measureLoop();
      return;
    }

    const handleImageLoad = () => {
      measureLoop();
    };

    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener(
          "load",
          handleImageLoad
        );
      }
    });

    measureLoop();

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          handleImageLoad
        );
      });
    };
  }, [measureLoop, unique]);

  /**
   * Keep animation running smoothly after resize.
   */
  useEffect(() => {
    if (!trackRef.current || !loopDistance) return;

    trackRef.current.style.setProperty(
      "--logos-loop-distance",
      `${loopDistance}px`
    );
  }, [loopDistance]);

  /**
   * Pause while interacting with the slider.
   */
  const pause = useCallback(() => {
    pointerDownRef.current = true;
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    pointerDownRef.current = false;

    window.setTimeout(() => {
      if (!pointerDownRef.current) {
        setPaused(false);
      }
    }, 350);
  }, []);

  /**
   * Toggle with keyboard.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  if (unique.length === 0) {
    return null;
  }

  /**
   * Render one logo.
   */
  const renderLogo = (
    project: Project,
    index: number,
    duplicate = false
  ) => {
    const projectTitle =
      locale === "ar"
        ? project.title_ar || project.title_en
        : project.title_en || project.title_ar;

    return (
      <Link
        key={`${duplicate ? "clone" : "original"}-${project.id}-${index}`}
        href={localizePath(
          `/projects/${project.slug}`,
          locale
        )}
        aria-label={projectTitle || "Project"}
        aria-hidden={duplicate}
        tabIndex={duplicate ? -1 : 0}
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
            loading={duplicate ? "eager" : "lazy"}
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
   * One logo does not need animation.
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

  /**
   * IMPORTANT:
   *
   * Do NOT reverse the data depending on RTL.
   *
   * The visual direction is controlled by the track
   * animation, not by flex-direction / dir="rtl".
   *
   * This prevents Arabic from reversing the actual
   * sequence of logos.
   */
  const firstGroup = unique;
  const secondGroup = unique;

  /**
   * Animation direction:
   *
   * Arabic:
   * First → Second → Third → ... → Last → First
   *
   * English:
   * First → Second → Third → ... → Last → First
   *
   * Both use the same physical ticker direction.
   *
   * The language itself must NOT cause the logos to
   * suddenly reverse their order.
   */
  const animationDirection = "normal";

  const animationDuration =
    loopDistance > 0
      ? `${Math.max(
          loopDistance /
            (typeof window !== "undefined" &&
            window.innerWidth < 640
              ? MOBILE_SPEED
              : DESKTOP_SPEED),
          4
        )}s`
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
        role="region"
        aria-label={headingText}
        tabIndex={0}
        dir="ltr"
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
          py-3
          outline-none
          touch-pan-y
        "
      >
        <div
          ref={trackRef}
          className={`
            logos-track
            flex
            w-max
            items-center
            gap-6
            will-change-transform
            sm:gap-7
            md:gap-8
            ${paused ? "logos-track-paused" : ""}
          `}
          style={{
            animationName: "client-logos-marquee",
            animationDuration,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationPlayState: paused
              ? "paused"
              : "running",
            animationDirection,
            "--logos-loop-distance":
              `${loopDistance}px`,
          } as React.CSSProperties}
        >
          {/* ORIGINAL GROUP */}
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
            {firstGroup.map((project, index) =>
              renderLogo(project, index, false)
            )}
          </div>

          {/* CLONED GROUP */}
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
            {secondGroup.map((project, index) =>
              renderLogo(project, index, true)
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .logos-track {
          transform: translate3d(0, 0, 0);
        }

        .logos-track-paused {
          animation-play-state: paused !important;
        }

        @keyframes client-logos-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(
              calc(-1 * var(--logos-loop-distance)),
              0,
              0
            );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .logos-track {
            animation: none !important;
            transform: translate3d(0, 0, 0) !important;
          }
        }
      `}</style>
    </section>
  );
}