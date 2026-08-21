"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function clamp(x: number, y: number, el?: HTMLElement | null) {
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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let initial: { x: number; y: number } | null = null;
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
      initial =
        defaultSide === "left"
          ? { x: 16, y: window.innerHeight - 120 }
          : { x: window.innerWidth - 72, y: window.innerHeight - 120 };
    }
    setPos(clamp(initial.x, initial.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Keep the widget inside the viewport when the window is resized.
  useEffect(() => {
    const onResize = () => {
      setPos((p) => (p ? clamp(p.x, p.y, containerRef.current) : p));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const next = clamp(
      dragRef.current.x + dx,
      dragRef.current.y + dy,
      containerRef.current,
    );
    setPos(next);
  }, []);

  if (!pos) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[60]"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
    >
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
