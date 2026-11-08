"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Home,
  MessageSquare,
  Compass,
  User,
  AlertTriangle,
  Bell,
  ChefHat,
  Wrench,
  Gift,
  Train,
  Briefcase,
  Building2,
  Sun,
  Moon,
  X,
  LogOut,
  HeartPulse,
  LucideIcon,
  ChevronRight,
  PackageSearch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Route } from "next";

// Adjust import paths according to your folder structure
import { useWard } from "@/context/wardContext";
import { Modal } from "@/components/shared-components";
import { WardSelector } from "../ward-selector";

// --- TYPESCRIPT DEFINITIONS ---

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: Route;
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
  logout: () => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed = false,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  // --- All Hooks Must Be Declared at the Top Level ---
  const [isWardModalOpen, setIsWardModalOpen] = useState<boolean>(false);

  // --- Ward Context ---
  const {
    logout,
    activeWard,
    authUser,
    isLoadingAuth,
    alerts = [],
    readAlerts = [],
    dismissedAlerts = [],
  } = useWard();

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
    { name: t("explore"), path: "/explore-places", icon: Compass },
    { name: t("foods"), path: "/food-and-dining", icon: ChefHat },
    { name: t("healthcare.title"), path: "/healthcare", icon: HeartPulse },
    {
      name: t("services.servicesTitle"),
      path: "/local-services",
      icon: Wrench,
    },
    { name: t("rentals.title"), path: "/rentals", icon: Building2 },
    { name: t("jobs.title"), path: "/jobs", icon: Briefcase },
    { name: t("donations") || "Donations", path: "/donations", icon: Gift },
    { name: t("transport"), path: "/transport", icon: Train },
    { name: "Lost & Found", path: "/lost-and-found", icon: PackageSearch },
  ];

  // Helper function to reliably check if a route is active (handles nested routing)
  const isItemActive = (itemPath: string) => {
    if (pathname === itemPath) return true;
    // Appending '/' ensures that '/complaints' matches '/complaints/report'
    // but doesn't accidentally match '/complaints-history'
    if (pathname.startsWith(`${itemPath}/`)) return true;
    return false;
  };

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
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        data-collapsed={isCollapsed}
        className={`${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} group fixed md:sticky top-0 left-0 z-50 md:z-auto flex flex-col w-72 sm:w-80 md:w-72 h-screen bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 md:p-4 select-none shrink-0 shadow-2xl md:shadow-none transition-[width,transform] duration-200 md:data-[collapsed=true]:w-20`}
      >
        {/* Logo & Mobile Close X */}
        <div
          className={`flex items-center justify-between mb-6 px-1 ${isCollapsed ? "justify-center" : ""}`}
        >
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              router.push("/dashboard");
              if (onClose) onClose();
            }}
          >
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-md flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform ${isCollapsed ? "h-11 w-11" : ""}`}
            >
              <img
                src="/logo.png"
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div className={`flex flex-col ${isCollapsed ? "hidden" : ""}`}>
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none grousp-hover:text-primary transition-colors">
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
          title={isLoadingAuth ? "Loading ward" : `Ward ${activeWard.id}`}
          aria-label={
            isLoadingAuth ? "Loading ward" : `Select Ward ${activeWard.id}`
          }
          className={`w-full max-w-full flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 hover:border-orange-500/40 text-left transition cursor-pointer shadow-sm group overflow-hidden box-border ${isCollapsed ? "mx-auto h-12 w-12 justify-center ps-8" : ""}`}
        >
          <div
            className={`flex items-center space-x-3 min-w-0 flex-1 pr-2 ${isCollapsed ? "flex-none p-0" : ""}`}
          >
            {isLoadingAuth ? (
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 font-black text-xs text-white shadow-md shadow-orange-500/20 sm:text-sm">
                W{activeWard.id}
              </div>
            )}
            <div
              className={`flex flex-col min-w-0 flex-1 ${isCollapsed ? "hidden" : ""}`}
            >
              {isLoadingAuth ? (
                <div className="space-y-1.5">
                  <span className="block h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <span className="block h-2.5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ) : (
                <>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug truncate">
                    Ward {activeWard.id || "Active Municipal Ward"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block w-full">
                    {activeWard.hints || "Active Municipal Ward"}
                  </span>
                </>
              )}
            </div>
          </div>

          <div
            className={`flex items-center space-x-0.5 text-primary shrink-0 group-hover:translate-x-1 transition-transform pl-1 ${isCollapsed ? "hidden" : ""}`}
          >
            <span className="text-[11px] font-extrabold">{t("edit")}</span>
            <ChevronRight size={14} />
          </div>
        </motion.button>

        {/* Navigation - Main Group */}
        <div className="flex-1 min-h-0 space-y-6 overflow-x-hidden overflow-y-auto pr-1 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div>
            <nav className="mt-2.5 space-y-1.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    title={item.name}
                    aria-label={item.name}
                    className={`flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${isCollapsed ? "mx-auto h-12 w-12 justify-center ps-8" : ""} ${
                      item.isSOS
                        ? isActive
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                          : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        : isActive
                          ? "bg-primary text-white shadow-lg shadow-primary/25"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                      <Icon
                        size={20}
                        strokeWidth={2.25}
                        aria-hidden="true"
                        className={item.isSOS ? "animate-pulse" : ""}
                      />
                    </span>
                    <span className={isCollapsed ? "hidden" : ""}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <span
              className={`px-2 text-[11px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase ${isCollapsed ? "hidden" : ""}`}
            >
              {t("quickUtilities")}
            </span>
            <nav className="mt-2.5 space-y-1.5">
              {quickModules.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    title={item.name}
                    aria-label={item.name}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${isCollapsed ? "mx-auto h-12 w-12 justify-center ps-8" : ""} ${
                      isActive
                        ? "bg-teal-700 text-white shadow-lg shadow-teal-700/25"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                        <Icon size={20} strokeWidth={2.25} aria-hidden="true" />
                      </span>
                      <span className={isCollapsed ? "hidden" : ""}>
                        {item.name}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
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
              onClick={async () => {
                await logout();
                if (onClose) onClose();
              }}
              title={t("logout")}
              aria-label={t("logout")}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer text-left active:scale-95 ${isCollapsed ? "mx-auto h-12 w-12 justify-center p-0" : ""}`}
            >
              <LogOut size={18} className="shrink-0" />
              <span className={isCollapsed ? "hidden" : ""}>{t("logout")}</span>
            </button>
          </div>
        </div>

        {/* Footer Settings / Theme Toggle */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 mt-auto flex items-center justify-between">
          <div
            className={`flex items-center space-x-3 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
              {isLoadingAuth ? (
                <span className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
              ) : authUser?.avatar ? (
                <img
                  src={authUser?.avatar}
                  alt={authUser?.name || "User Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{authUser?.name?.charAt(0)}</span>
              )}
            </div>
            <div className={isCollapsed ? "hidden" : "flex flex-col"}>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                {isLoadingAuth ? (
                  <span className="block h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  authUser?.name || "Resident"
                )}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Ward {activeWard.id}
              </span>
            </div>
          </div>

          <div
            className={isCollapsed ? "hidden" : "flex items-center space-x-1.5"}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                await logout();
                if (onClose) onClose();
              }}
              className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer text-left active:scale-95"
              aria-label="Toggle theme"
            >
              <LogOut size={18} className="shrink-0" />
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
