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

const DESKTOP_SPEED = 45;
const TABLET_SPEED = 42;
const MOBILE_SPEED = 38;

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
   * Remove duplicated projects.
   * A project without a logo is ignored.
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

  const trackRef =
    useRef<HTMLDivElement | null>(null);

  const firstGroupRef =
    useRef<HTMLDivElement | null>(null);

  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(30);
  const [paused, setPaused] = useState(false);

  /*
   * Get the correct speed for the viewport.
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
   * Measure the first complete group.
   */
  const measure = useCallback(() => {
    if (!firstGroupRef.current) {
      return;
    }

    const width =
      firstGroupRef.current.getBoundingClientRect().width;

    if (width <= 0) {
      return;
    }

    const speed = getSpeed();

    setDistance(width);
    setDuration(Math.max(width / speed, 8));
  }, [getSpeed]);

  /*
   * Initial measurement.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      measure();
    }, 100);

    window.addEventListener("resize", measure);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [clients.length, measure]);

  /*
   * Re-measure after images load.
   */
  useEffect(() => {
    if (clients.length <= 1) {
      return;
    }

    const images =
      firstGroupRef.current?.querySelectorAll("img");

    if (!images) {
      return;
    }

    const onImageLoad = () => {
      measure();
    };

    images.forEach((image) => {
      image.addEventListener("load", onImageLoad);
    });

    measure();

    return () => {
      images.forEach((image) => {
        image.removeEventListener(
          "load",
          onImageLoad
        );
      });
    };
  }, [clients.length, measure]);

  /*
   * Pause on pointer interaction.
   */
  const pause = useCallback(() => {
    setPaused(true);
  }, []);

  /*
   * Resume after pointer interaction.
   */
  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  /*
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

  /*
   * No logos.
   */
  if (clients.length === 0) {
    return null;
  }

  /*
   * Render one logo.
   */
  const renderLogo = (
    project: Project,
    index: number,
    cloned: boolean
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
        key={
          (cloned ? "clone-" : "logo-") +
          project.id +
          "-" +
          index
        }
        href={localizePath(
          "/projects/" + project.slug,
          locale
        )}
        aria-label={projectName}
        aria-hidden={
          cloned ? true : undefined
        }
        tabIndex={cloned ? -1 : undefined}
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
            src={project.logo || ""}
            alt=""
            draggable={false}
            loading={cloned ? "eager" : "lazy"}
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

        <div className="flex justify-center">
          {renderLogo(clients[0], 0, false)}
        </div>
      </section>
    );
  }

  /*
   * Calculate the animation distance.
   *
   * We include the gap between the two groups.
   */
  const animationDistance =
    distance > 0
      ? distance + 24
      : 0;

  /*
   * Inline animation declaration.
   *
   * No CSS variables.
   * No style jsx.
   * No React.CSSProperties.
   */
  const animationStyle =
    animationDistance > 0
      ? {
          animationName: isArabic
            ? "clientLogosRTL"
            : "clientLogosLTR",
          animationDuration:
            duration + "s",
          animationTimingFunction: "linear",
          animationIterationCount:
            "infinite",
          animationPlayState: paused
            ? "paused"
            : "running",
        }
      : undefined;

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
            sm:gap-7
            md:gap-8
          "
          style={animationStyle}
        >
          {/* ORIGINAL GROUP */}
          <div
            ref={firstGroupRef}
            className="
              flex
              shrink-0
              items-center
              gap-6
              sm:gap-7
              md:gap-8
            "
          >
            {clients.map(
              (project, index) =>
                renderLogo(
                  project,
                  index,
                  false
                )
            )}
          </div>

          {/* IDENTICAL TECHNICAL CLONE */}
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
            {clients.map(
              (project, index) =>
                renderLogo(
                  project,
                  index,
                  true
                )
            )}
          </div>
        </div>
      </div>

      <style>{`
        .client-logos-track {
          will-change: transform;
        }

        @keyframes clientLogosLTR {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(
              calc(-1 * var(--client-logo-distance))
            );
          }
        }

        @keyframes clientLogosRTL {
          from {
            transform: translateX(
              calc(-1 * var(--client-logo-distance))
            );
          }

          to {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .client-logos-track {
            animation: none !important;
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </section>
  );
}