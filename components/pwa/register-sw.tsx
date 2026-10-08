"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) =>
          console.log("PWA Service Worker registered successfully:", reg.scope),
        )
        .catch((err) =>
          console.error("Service Worker registration failed:", err),
        );
    }
  }, []);

  return null;
}
