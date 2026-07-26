"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Bell,
  Menu,
  User,
  LogOut,
  MapPin,
  ChevronDown,
} from "lucide-react";

// Context imports (Adjust paths if your directory structure differs)
import { useWard } from "@/context/ward";

// Component imports
import { Modal } from "@/components/shared-components";
import { useTheme } from "@teispace/next-themes/client";
import { useLocale, useTranslations } from "next-intl";
import { WardSelector } from "../ward-selector";

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
  resetOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const router = useRouter();

  // --- Hydration Mounting Safety State ---
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    activeWard,
    alerts = [],
    readAlerts = [],
    dismissedAlerts = [],
    userProfile = {},
    resetOnboarding = () => {},
  } = useWard() as WardContextType;

  // Theme & Language Hooks
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const t = useTranslations();
  const locale = useLocale();

  // Modal State
  const [isWardModalOpen, setIsWardModalOpen] = useState<boolean>(false);

  const unreadAlertsCount = alerts.filter(
    (alert) =>
      !readAlerts.includes(alert.id) && !dismissedAlerts.includes(alert.id),
  ).length;

  const userName = userProfile?.name || "Avadi Resident";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    resetOnboarding();
    setIsDropdownOpen(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs">
        {/* Left Section: Menu Button & Compact App Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div
            className="flex items-center space-x-2.5 cursor-pointer group min-w-0"
            onClick={() => router.push("/")}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-xs flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition">
              <img
                src="/logo.png"
                alt="AVADI CITY Logo"
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase truncate">
                WARD {activeWard?.id || "00"} ·{" "}
                <span className="hidden xs:inline">CONNECTING CITIZENS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Clean Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          {/* Action Icons Pill */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/60 rounded-full border border-slate-200/60 dark:border-slate-750 p-0.5 sm:p-1 space-x-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {mounted ? (
                isDark ? (
                  <Sun size={15} className="text-amber-400" />
                ) : (
                  <Moon size={15} />
                )
              ) : (
                <div className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => router.push("/notifications")}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={15} />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
              )}
            </button>
          </div>

          {/* User Profile Pill / Avatar Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 py-1 px-1.5 sm:px-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition cursor-pointer active:scale-95"
              aria-label="User Menu"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                {userInitial}
              </div>
              <div className="hidden md:flex flex-col text-left min-w-0">
                <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate max-w-24">
                  {userName}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Ward {activeWard?.id}
                </span>
              </div>
              <ChevronDown
                size={13}
                className="text-slate-400 shrink-0 hidden sm:block"
              />
            </button>

            {/* Floating Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {userName}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Ward {activeWard?.id} Resident
                  </p>
                </div>

                <div className="p-1.5 space-y-0.5 text-xs font-bold">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <User size={15} className="text-primary" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsWardModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <MapPin size={15} className="text-emerald-500" />
                    <span>Change Ward</span>
                  </button>
                </div>

                <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer font-bold text-xs"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide up Ward Selector Modal */}
      <Modal
        isOpen={isWardModalOpen}
        onClose={() => setIsWardModalOpen(false)}
        title="Change Active Ward"
      >
        <WardSelector onClose={() => setIsWardModalOpen(false)} />
      </Modal>
    </>
  );
};

export default Navbar;
