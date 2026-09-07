"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  /*
   * Remove duplicate projects.
   * Each real client/project appears once.
   */
  const unique = Array.from(
    new Map(
      logos
        .filter(
          (project) =>
            project &&
            project.id &&
            project.logo
        )
        .map((project) => [project.id, project])
    ).values()
  );

  const groupRef = useRef<HTMLDivElement | null>(null);

  const [groupWidth, setGroupWidth] = useState(0);
  const [paused, setPaused] = useState(false);

  /*
   * Measure the first group.
   *
   * The animation moves exactly one complete group.
   * This makes the duplicated second group line up
   * perfectly with the first group when the animation
   * starts again.
   */
  const measureGroup = useCallback(() => {
    if (!groupRef.current) {
      return;
    }

    const width =
      groupRef.current.getBoundingClientRect().width;

    if (width > 0) {
      setGroupWidth(width);
    }
  }, []);

  /*
   * Initial measurement + responsive measurement.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      return;
    }

    const update = () => {
      measureGroup();
    };

    const frame = window.requestAnimationFrame(update);

    window.addEventListener("resize", update);

    let observer: ResizeObserver | null = null;

    if (
      typeof ResizeObserver !== "undefined" &&
      groupRef.current
    ) {
      observer = new ResizeObserver(() => {
        measureGroup();
      });

      observer.observe(groupRef.current);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [measureGroup, unique.length]);

  /*
   * Re-measure after images have loaded.
   */
  useEffect(() => {
    if (unique.length <= 1) {
      return;
    }

    const images =
      groupRef.current?.querySelectorAll("img");

    if (!images || images.length === 0) {
      measureGroup();
      return;
    }

    const handleImageLoad = () => {
      measureGroup();
    };

    images.forEach((image) => {
      image.addEventListener("load", handleImageLoad);
    });

    measureGroup();

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          handleImageLoad
        );
      });
    };
  }, [measureGroup, unique.length]);

  /*
   * Pause when the user interacts with the slider.
   */
  const handlePointerDown = useCallback(() => {
    setPaused(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setPaused(false);
  }, []);

  /*
   * Touch events are intentionally separate.
   * They do not receive or expect PointerEvent types.
   */
  const handleTouchStart = useCallback(() => {
    setPaused(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setPaused(false);
  }, []);

  const handleTouchCancel = useCallback(() => {
    setPaused(false);
  }, []);

  /*
   * Keyboard accessibility.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setPaused((current) => !current);
      }
    },
    []
  );

  /*
   * No client logos.
   */
  if (unique.length === 0) {
    return null;
  }

  /*
   * Render a single logo.
   */
  const renderLogo = (
    project: Project,
    index: number,
    duplicate: boolean
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
        tabIndex={duplicate ? -1 : undefined}
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

  /*
   * If there is only one logo, there is no need for
   * an infinite slider.
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
          {renderLogo(unique[0], 0, false)}
        </div>
      </section>
    );
  }

  /*
   * The distance of one complete cycle.
   *
   * The two groups have the exact same contents,
   * dimensions and gap.
   */
  const animationDistance = groupWidth;

  /*
   * Fixed duration based on the actual group width.
   *
   * This keeps the visual speed consistent.
   */
  const animationDuration =
    animationDistance > 0
      ? `${Math.max(
          animationDistance / 45,
          8
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
        onTouchCancel={handleTouchCancel}
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
          className="
            client-logos-track
            flex
            w-max
            items-center
            gap-6
            sm:gap-7
            md:gap-8
          "
          style={{
            "--logo-loop-distance": `${animationDistance}px`,
            "--logo-animation-duration": animationDuration,
          } as React.CSSProperties}
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
              renderLogo(
                project,
                index,
                false
              )
            )}
          </div>

          {/* SECOND GROUP - technical clone */}
          <div
            aria-hidden="true"
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
              renderLogo(
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
          animation-duration: var(
            --logo-animation-duration
          );
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-play-state: ${paused
            ? "paused"
            : "running"};
          animation-direction: ${isAr
            ? "reverse"
            : "normal"};
          will-change: transform;
        }

        @keyframes client-logos-scroll {
          from {
            transform: translate3d(
              0,
              0,
              0
            );
          }

          to {
            transform: translate3d(
              calc(
                -1 *
                  var(
                    --logo-loop-distance
                  )
              ),
              0,
              0
            );
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .client-logos-track {
            animation: none !important;
            transform: translate3d(
              0,
              0,
              0
            ) !important;
          }
        }
      `}</style>
    </section>
  );
}