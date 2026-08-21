"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent({ event_type: "page_view", page_path: pathname });
  }, [pathname]);

  return null;
}
