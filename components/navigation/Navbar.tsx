"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sun,
  Moon,
  Bell,
  Menu,
  User,
  LogOut,
  MapPin,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

// Context & Theme imports
import { useWard } from "@/context/wardContext";
import { useTheme } from "@teispace/next-themes/client";

// Component imports
import { Modal } from "@/components/shared-components";
import { WardSelector } from "../ward-selector";

export interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const router = useRouter();

  // 1. Single unified hook call extracting Auth & Civic state
  const {
    authUser,
    isAuthenticated,
    logout,
    activeWard,
    alerts = [],
    readAlerts = [],
    dismissedAlerts = [],
  } = useWard();

  // --- Hydration Mounting Safety State ---
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
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

  // Theme Hook
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // Derived user details from live backend auth state
  const userName = authUser?.name || "Avadi Resident";
  const userInitial = userName.charAt(0).toUpperCase();
  const currentWardId = authUser?.wardNumber || activeWard?.id || "00";

  // Unread alerts calculation
  const unreadAlertsCount = alerts.filter(
    (alert) =>
      !readAlerts.includes(alert.id) && !dismissedAlerts.includes(alert.id),
  ).length;

  // Execute backend session logout
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
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
            onClick={() => router.push("/dashboard")}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-xs flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition">
              <img
                src="/logo.png"
                alt="AVADI CITY Logo"
                className="w-full h-full object-cover object-center rounded-lg"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              {/* <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase truncate">
                WARD {currentWardId} ·{" "}
                <span className="hidden xs:inline">CONNECTING CITIZENS</span>
              </span> */}
            </div>
          </div>
        </div>

        {/* Right Section: Clean Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Action Icons Pill */}
          <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/60 rounded-full border border-slate-200/60 dark:border-slate-800 p-1 gap-1 shadow-2xs">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              aria-label="Toggle theme"
            >
              {mounted ? (
                isDark ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => router.push("/notifications")}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer active:scale-90"
              aria-label="Notifications"
            >
              <Bell size={16} />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </button>
          </div>

          {/* User Profile Pill / Guest Sign-In Button */}
          {isAuthenticated && authUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition cursor-pointer active:scale-95 shadow-2xs"
                aria-label="User Menu"
              >
                {/* 👇 R2 Avatar rendering with smooth initial badge fallback */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                  {authUser.avatar ? (
                    <img
                      src={authUser.avatar}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>

                <div className="hidden md:flex flex-col text-left min-w-0 pr-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate max-w-24">
                      {userName}
                    </span>
                    {authUser.isVerified && (
                      <ShieldCheck
                        size={13}
                        className="text-teal-500 shrink-0"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Ward {currentWardId}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  className="text-slate-400 shrink-0 hidden sm:block mr-1"
                />
              </button>

              {/* Floating Dropdown Menu (Optimized for mobile thumbs) */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {authUser.email || `Ward ${currentWardId} Resident`}
                    </p>
                  </div>

                  <div className="p-1.5 space-y-0.5 text-xs font-bold">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-[0.98]"
                    >
                      <User size={16} className="text-primary shrink-0" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsWardModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer active:scale-[0.98]"
                    >
                      <MapPin size={16} className="text-emerald-500 shrink-0" />
                      <span>Change Ward</span>
                    </button>
                  </div>

                  <div className="p-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer font-bold text-xs active:scale-[0.98]"
                    >
                      <LogOut size={16} className="shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unauthenticated Guest CTA */
            <Link
              href="/get-started"
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-primary hover:bg-orange-600 text-white font-extrabold text-xs transition shadow-sm active:scale-95 shrink-0"
            >
              Sign In
            </Link>
          )}
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
