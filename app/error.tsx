"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, AlertTriangle, Home, LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log exception to monitoring service (Sentry, LogRocket, etc.)
    console.error("App Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none font-sans transition-colors duration-300">
      {/* Background Ambient Glow Effects */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/60 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-2 sm:px-6 py-4">
          <Link
            href="/"
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src={"/logo.png"}
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-widest uppercase mt-0.5">
                CONNECTING AVADIANS
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Error Card */}
      <main className="relative z-10 my-auto py-8 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-rose-500/30 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-rose-950/40 text-center space-y-6 relative overflow-hidden transition-colors duration-300"
        >
          {/* Error Icon */}
          <div className="w-20 h-20 rounded-3xl bg-rose-100 dark:bg-rose-500/15 border-2 border-rose-300 dark:border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-500 mx-auto shadow-md">
            <AlertTriangle size={36} className="animate-bounce" />
          </div>

          {/* Text Details */}
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-500/30">
              System Alert
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-5">
              Something Went Wrong
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed px-1">
              We encountered a temporary connection glitch. Don&apos;t
              worry—your local ward data and saved settings remain secure.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => reset()}
              className="w-full py-3.5 px-4 bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>Try Again / Reload Screen</span>
            </button>

            <Link
              href="/"
              className="w-full py-3 px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-2xl border border-slate-200 dark:border-white/15 backdrop-blur-md transition flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <Home size={15} />
              <span>Return to Home</span>
            </Link>
          </div>

          {/* Support Link */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <LifeBuoy
                size={14}
                className="text-rose-500 dark:text-rose-400"
              />
              <span>Need Assistance?</span>
            </span>
            <Link
              href="/contact"
              className="text-rose-600 dark:text-rose-400 hover:underline font-black"
            >
              Contact Support →
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Simple Footer Bar */}
      <footer className="relative z-10 max-w-md mx-auto w-full pt-4 border-t border-slate-200/80 dark:border-white/10 text-center space-y-1">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          One Avadi.{" "}
          <span className="text-orange-500 dark:text-orange-400 font-black">
            48 Wards.
          </span>{" "}
          Infinite Possibilities.
        </p>
      </footer>
    </div>
  );
}
