"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const NAVIGATION_EVENT = "avadi:navigation-start";

export default function RouteProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsNavigating(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    const start = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setIsNavigating(true);
        timeoutRef.current = setTimeout(() => {
          setIsNavigating(false);
          timeoutRef.current = null;
        }, 10000);
      }, 0);
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = (event.target as Element).closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }

      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname === window.location.pathname
      ) {
        return;
      }

      start();
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const notifyNavigation = () =>
      window.dispatchEvent(new Event(NAVIGATION_EVENT));

    history.pushState = function (...args) {
      notifyNavigation();
      return originalPushState.apply(this, args);
    };
    history.replaceState = function (...args) {
      notifyNavigation();
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener(NAVIGATION_EVENT, start);
    window.addEventListener("popstate", start);
    document.addEventListener("click", handleClick, true);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener(NAVIGATION_EVENT, start);
      window.removeEventListener("popstate", start);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      aria-label="Loading page"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-9999 h-1 overflow-hidden bg-primary/20"
      role="progressbar"
    >
      <div className="h-full w-1/3 animate-[route-progress_1.2s_ease-in-out_infinite] bg-primary shadow-[0_0_10px_var(--color-primary)]" />
    </div>
  );
}
