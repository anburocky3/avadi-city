"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, MapPinOff, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface NotFoundProps {
  customTitle?: string;
  customDescription?: string;
}

export default function NotFound({
  customTitle = "Page Not Found",
  customDescription = "We couldn't find the page you were looking for. It might have been moved, renamed, or is temporarily unavailable.",
}: NotFoundProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none font-sans transition-colors duration-300">
      {/* Background Ambient Glow Effects */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-amber-500/10 dark:bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-125 h-125 bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / App Shell Bar */}
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

      {/* Main Error Content Card */}
      <main className="relative z-10 my-auto py-8 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/80 text-center space-y-6 relative overflow-hidden transition-colors duration-300"
        >
          {/* Decorative Corner Badge */}
          <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 font-black text-[9px] uppercase tracking-wider">
            Error 404
          </div>

          {/* Central Animated Illustration Icon */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-orange-500/15 animate-ping opacity-75" />
            <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-linear-to-b dark:from-slate-800 dark:to-slate-900 border-2 border-orange-500/40 dark:border-orange-500/50 flex items-center justify-center text-orange-500 shadow-md relative z-10">
              <MapPinOff size={36} className="stroke-2" />
            </div>
          </div>

          {/* Text Description */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {customTitle}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed px-1">
              {customDescription}
            </p>
            <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400/90 pt-1 flex items-center justify-center space-x-1">
              <Sparkles size={12} className="inline mr-1" />
              <span>பக்கம் கிடைக்கவில்லை · ஆவடி நகரம்</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <Link
              href="/"
              className="w-full py-3.5 px-4 bg-linear-to-r from-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <Home size={16} />
              <span>Back to Home</span>
            </Link>

            <button
              onClick={() => router.back()}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-extrabold text-xs rounded-2xl border border-slate-200 dark:border-white/15 backdrop-blur-md transition flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Go Back</span>
            </button>
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
