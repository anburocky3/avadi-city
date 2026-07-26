"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  MessageSquare,
  Compass,
  ShieldAlert,
  User,
  AlertTriangle,
  Bell,
  ChefHat,
  Wrench,
  HeartHandshake,
  Train,
  Briefcase,
  Building2,
  Sun,
  Moon,
  X,
  LogOut,
  HeartPulse,
  LucideIcon,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Adjust import paths according to your folder structure
import { useWard } from "@/context/ward";
import { Modal } from "@/components/shared-components";
import { WardSelector } from "../ward-selector";

// --- TYPESCRIPT DEFINITIONS ---

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isSOS?: boolean;
  badge?: number | null;
}

interface Alert {
  id: string | number;
  [key: string]: any;
}

interface WardContextType {
  activeWard: {
    id: number;
    name: string;
    hints?: string;
    [key: string]: any;
  };
  alerts: Alert[];
  readAlerts: (string | number)[];
  dismissedAlerts: (string | number)[];
  resetOnboarding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  // --- All Hooks Must Be Declared at the Top Level ---
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState<boolean>(false);

  // --- Theme Setup ---
  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // --- Ward Context ---
  const {
    activeWard = { id: 14, name: "Avadi Central", hints: "" },
    alerts = [],
    readAlerts = [],
    dismissedAlerts = [],
    resetOnboarding = () => {},
  } = useWard() as WardContextType;

  // Safe Guard Return AFTER all hooks have been declared
  if (!mounted) {
    return (
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 w-12 h-12 opacity-0" />
    );
  }

  // Calculate unread alerts
  const unreadAlertsCount = alerts.filter(
    (alert) =>
      !readAlerts.includes(alert.id) && !dismissedAlerts.includes(alert.id),
  ).length;

  const mainNav: NavItem[] = [
    { name: t("home"), path: "/dashboard", icon: Home },
    { name: t("feed"), path: "/feed", icon: MessageSquare },
    { name: t("complaints"), path: "/complaints", icon: AlertTriangle },
  ];

  const quickModules: NavItem[] = [
    { name: t("explore"), path: "/explore", icon: Compass },
    { name: t("foods"), path: "/foods", icon: ChefHat },
    { name: t("healthcare.title"), path: "/healthcare", icon: HeartPulse },
    { name: t("services.servicesTitle"), path: "/services", icon: Wrench },
    { name: t("rentals.title"), path: "/rentals", icon: Building2 },
    { name: t("jobs.title"), path: "/jobs", icon: Briefcase },
    { name: t("volunteers.title"), path: "/volunteers", icon: HeartHandshake },
    { name: t("transport"), path: "/transport", icon: Train },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.aside
        initial={false}
        animate={{
          x:
            isOpen ||
            (typeof window !== "undefined" && window.innerWidth >= 768)
              ? 0
              : "-100%",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:sticky top-0 left-0 z-50 md:z-auto flex flex-col w-72 sm:w-80 h-screen bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 select-none shrink-0 shadow-2xl md:shadow-none"
      >
        {/* Logo & Mobile Close X */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              router.push("/");
              if (onClose) onClose();
            }}
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none group-hover:text-primary transition-colors">
                AVADI <span className="text-primary font-black">CITY</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider mt-1 uppercase">
                CONNECTING CITIZENS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden cursor-pointer flex items-center justify-center active:scale-95 transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modern Animated Selected Ward Widget */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsWardModalOpen(true);
            if (onClose) onClose();
          }}
          className="w-full max-w-full flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 hover:border-orange-500/40 text-left transition cursor-pointer shadow-xs group overflow-hidden box-border"
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-md shadow-orange-500/20 shrink-0">
              W{activeWard.id}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug truncate">
                {activeWard.name}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block w-full">
                {activeWard.hints || "Active Municipal Ward"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-0.5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform pl-1">
            <span className="text-[11px] font-extrabold">{t("edit")}</span>
            <ChevronRight size={14} />
          </div>
        </motion.button>

        {/* Navigation - Main Group */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1 scrollbar-thin">
          <div>
            <span className="px-2 text-[11px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              {t("mainPages")}
            </span>
            <nav className="mt-2.5 space-y-1.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-98 ${
                      item.isSOS
                        ? isActive
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                          : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        : isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/25"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={item.isSOS ? "animate-pulse" : ""}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="px-2 text-[11px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              {t("quickUtilities")}
            </span>
            <nav className="mt-2.5 space-y-1.5">
              {quickModules.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-98 ${
                      isActive
                        ? "bg-teal-700 text-white shadow-lg shadow-teal-700/25"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-900">
            <button
              onClick={() => {
                resetOnboarding();
                if (onClose) onClose();
                router.push("/");
              }}
              className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer text-left active:scale-98"
            >
              <LogOut size={18} className="shrink-0" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>

        {/* Footer Settings / Theme Toggle */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-xs sm:text-sm text-slate-800 dark:text-slate-200 uppercase shadow-xs">
              {activeWard.name ? activeWard.name[0] : "A"}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                Avadi Resident
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Ward {activeWard.id}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer shadow-xs"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.aside>

      <Modal
        isOpen={isWardModalOpen}
        onClose={() => setIsWardModalOpen(false)}
        title="Select Active Ward"
      >
        <WardSelector onClose={() => setIsWardModalOpen(false)} />
      </Modal>
    </>
  );
};

export default Sidebar;
