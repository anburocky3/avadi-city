"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useWard } from "@/context/wardContext";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

function PageViewTrackerInternal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeWard } = useWard();

  useEffect(() => {
    if (!pathname) return;

    // Detect if running as standalone PWA
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    const fullUrl = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    trackEvent(AnalyticsEvents.PAGE_VIEW, {
      path: pathname,
      full_url: fullUrl,
      ward_id: activeWard?.id ? String(activeWard.id) : "unselected",
      ward_name: activeWard?.name || "unselected",
      is_pwa: isStandalone,
    });
  }, [pathname, searchParams, activeWard?.id]);

  return null;
}

export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInternal />
    </Suspense>
  );
}
