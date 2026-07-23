"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Bell, Menu } from "lucide-react";

// Context imports (Adjust paths if your directory structure differs)
import { useWard } from "@/context/ward";

// Component imports
import { Modal } from "@/components/shared-components";
import { useTheme } from "@teispace/next-themes/client";
import { useLocale, useTranslations } from "next-intl";
// import { WardSelector } from "./WardSelector";

// --- TYPESCRIPT DEFINITIONS ---

export interface NavbarProps {
  onMenuClick: () => void;
}

interface Alert {
  id: string | number;
  [key: string]: any;
}

interface UserProfile {
  name?: string;
  wardNumber?: number;
  [key: string]: any;
}

interface WardContextType {
  activeWard: {
    id: number;
    name: string;
    [key: string]: any;
  };
  alerts: Alert[];
  readAlerts: (string | number)[];
  dismissedAlerts: (string | number)[];
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const router = useRouter();

  // Unwrap Ward Context with strict typing
  const {
    activeWard,
    alerts = [],
    readAlerts = [],
    dismissedAlerts = [],
    userProfile = {},
  } = useWard() as WardContextType;

  // Theme & Language Hooks
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // Language & Translation Hooks
  const t = useTranslations();
  const locale = useLocale(); // Returns "en" or "ta"
  const language = locale; // Aliased so you don't have to rename variable references below

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "ta" : "en";
    // Sets the NEXT_LOCALE cookie so Next.js server components render in the new language
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh(); // Re-hydrates the page with the updated translations
  };

  // Modal State
  const [isWardModalOpen, setIsWardModalOpen] = useState<boolean>(false);

  // Count unread alerts that are not dismissed
  const unreadAlertsCount = alerts.filter(
    (alert) =>
      !readAlerts.includes(alert.id) && !dismissedAlerts.includes(alert.id),
  ).length;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3.5 py-3 flex items-center justify-between ">
        {/* Hamburger Menu & App Logo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition active:scale-95 cursor-pointer flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 p-0.5 shadow-sm group-hover:shadow-md transition-all flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-800 dark:text-slate-100 leading-none group-hover:text-primary transition-colors">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
                SUPER-APP
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          {/* Action Icons Pill Deck */}
          <div className="flex items-center bg-slate-100/60 dark:bg-slate-800/50 rounded-full border border-slate-200/50 dark:border-slate-750 p-0.5 space-x-1">
            {/* 1. Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-655 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Toggle theme"
              title="Toggle Theme"
            >
              {isDark ? (
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} />
              )}
            </button>

            {/* 2. Notifications Bell */}
            <button
              onClick={() => router.push("/alerts")}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-650 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
              )}
            </button>

            {/* 3. Resident Profile Avatar */}
            <button
              onClick={() => router.push("/profile")}
              className="w-7 h-7 mx-0.5 rounded-full bg-linear-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-2 ring-indigo-500/30 dark:ring-indigo-400/30"
              aria-label="Resident Profile"
              title="Profile"
            >
              {userProfile?.name
                ? userProfile.name.charAt(0).toUpperCase()
                : "A"}
            </button>
          </div>
        </div>
      </header>

      {/* Slide up Ward Selector Modal */}
      {/* <Modal
        isOpen={isWardModalOpen}
        onClose={() => setIsWardModalOpen(false)}
        title="Change Active Ward"
      >
        <WardSelector onClose={() => setIsWardModalOpen(false)} />
      </Modal> */}
    </>
  );
};

export default Navbar;
