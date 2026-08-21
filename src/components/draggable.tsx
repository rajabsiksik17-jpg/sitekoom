"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Pos {
  x: number; // distance from the anchored side edge
  y: number; // distance from the viewport bottom
}

function clamp(side: "left" | "right", x: number, y: number, el?: HTMLElement | null): Pos {
  const w = typeof window !== "undefined" ? window.innerWidth : 0;
  const h = typeof window !== "undefined" ? window.innerHeight : 0;
  const ew = el?.offsetWidth ?? 60;
  const eh = el?.offsetHeight ?? 60;
  return {
    x: Math.min(Math.max(x, 4), Math.max(4, w - ew - 4)),
    y: Math.min(Math.max(y, 4), Math.max(4, h - eh - 4)),
  };
}

export function Draggable({
  storageKey,
  defaultSide = "left",
  children,
}: {
  storageKey: string;
  defaultSide?: "left" | "right";
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<Pos | null>(null);
  const side = defaultSide === "right" ? "right" : "left";
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let initial: Pos | null = null;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === "number" && typeof p.y === "number") initial = p;
      }
    } catch {
      /* ignore */
    }
    if (!initial) {
      initial = { x: 16, y: 96 };
    }
    setPos(clamp(side, initial.x, initial.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Re-clamp when the widget resizes (e.g. a popup menu opens above the button)
  // and when the window is resized, so it never leaves the viewport.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const doClamp = () => {
      setPos((p) => (p ? clamp(side, p.x, p.y, el) : p));
    };
    const ro = new ResizeObserver(doClamp);
    ro.observe(el);
    window.addEventListener("resize", doClamp);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", doClamp);
    };
  }, [side]);

  useEffect(() => {
    if (pos) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(pos));
      } catch {
        /* ignore */
      }
    }
  }, [pos, storageKey]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setPos((p) => {
      if (!p) return p;
      dragRef.current = { startX: e.clientX, startY: e.clientY, x: p.x, y: p.y };
      return p;
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const next = clamp(
        side,
        dragRef.current.x + (side === "right" ? -dx : dx),
        dragRef.current.y - dy,
        containerRef.current,
      );
      setPos(next);
    },
    [side],
  );

  if (!pos) return null;

  const style: React.CSSProperties =
    side === "right"
      ? { right: pos.x, bottom: pos.y, touchAction: "none" }
      : { left: pos.x, bottom: pos.y, touchAction: "none" };

  return (
    <div ref={containerRef} className="fixed z-[60]" style={style}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragRef.current = null)}
        className="cursor-grab select-none active:cursor-grabbing"
      >
        {children}
      </div>
    </div>
  );
}
