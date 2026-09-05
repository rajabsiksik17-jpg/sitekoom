"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals code lines one-by-one the first time the target enters the viewport.
 * - runs once per mount
 * - respects prefers-reduced-motion (reveals instantly)
 * - uses a single interval, no continuous loops
 */
export function useCodeReveal(lineCount: number, speedMs = 90, threshold = 0.25) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStarted(true);
      setVisibleLines(lineCount);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            setStarted(true);
          }
        });
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lineCount, threshold]);

  useEffect(() => {
    if (!started || visibleLines >= lineCount) return;
    const id = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= lineCount) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, speedMs);
    return () => clearInterval(id);
  }, [started, visibleLines, lineCount, speedMs]);

  return { ref, visibleLines, done: visibleLines >= lineCount };
}

/**
 * A single code line of tokens, revealed when `visible` is true.
 * Renders line number + tokens with syntax colors + optional caret.
 */
export function CodeLine({
  index,
  tokens,
  visible,
  caret,
  tokenClass,
}: {
  index: number;
  tokens: readonly (readonly [string, string])[];
  visible: boolean;
  caret?: boolean;
  tokenClass: Record<string, string>;
}) {
  if (!visible) {
    // keep layout height stable to avoid jumps
    return <div className="flex min-h-[1.75rem]" aria-hidden="true" />;
  }
  return (
    <div className="flex min-h-[1.75rem]">
      <span className="w-8 shrink-0 select-none text-right text-white/20 pe-3">{index + 1}</span>
      <span className="flex flex-1 flex-wrap gap-x-1 text-left">
        {tokens.map(([text, cls], j) =>
          text ? (
            <span key={j} className={tokenClass[cls] ?? "text-white/80"}>
              {text}
            </span>
          ) : null,
        )}
        {caret && <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand-300" aria-hidden="true" />}
      </span>
    </div>
  );
}
