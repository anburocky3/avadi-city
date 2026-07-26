"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9 rounded-xl border border-slate-200/50 bg-slate-100/50 dark:border-slate-800/50 dark:bg-slate-900/50 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-700 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:shadow-slate-950/20"
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative flex items-center justify-center">
        <Sun
          size={18}
          className={`transform text-amber-500 transition-all duration-500 ease-spring ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
        />
        <Moon
          size={18}
          className={`transform text-indigo-500 transition-all duration-500 ease-spring ${
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </div>

      {/* Subtle hover glow ring */}
      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
    </button>
  );
}
