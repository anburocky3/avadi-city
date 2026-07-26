"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt in this session
    const isDismissed = sessionStorage.getItem("pwa_banner_dismissed");
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the PWA install prompt");
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("pwa_banner_dismissed", "true");
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
      >
        <div className="bg-slate-900/95 dark:bg-slate-900 border-2 border-orange-500/50 backdrop-blur-xl text-white p-4 rounded-3xl shadow-2xl shadow-orange-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            {/* <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-orange-500 to-amber-500 flex items-center justify-center shrink-0 shadow-md"> */}
            {/* <Smartphone size={24} className="text-white" /> */}
            <Image
              src="/icons/icon-192x192.png"
              alt="PWA Icon"
              width={32}
              height={32}
              className="text-white"
            />
            {/* </div> */}

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h4 className="font-black text-sm tracking-tight truncate text-white">
                  Install Avadi City App
                </h4>
                <Sparkles
                  size={14}
                  className="text-amber-400 shrink-0 animate-pulse"
                />
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                Fast offline access, emergency alerts & instant loading
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
            >
              <Download size={14} />
              <span>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
