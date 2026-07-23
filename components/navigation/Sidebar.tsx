"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@teispace/next-themes"; // Or "@teispace/next-themes" if using the script tag fix
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
} from "lucide-react";

// Adjust import paths according to your folder structure
import { useWard } from "@/context/ward";
import { Modal } from "@/components/shared-components";
// import { WardSelector } from "./WardSelector";

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

  // --- Theme Setup ---
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // --- Ward Context ---
  const {
    activeWard = { id: 14, name: "Avadi Central", hints: "" },
    alerts = [],
    readAlerts = [],
    dismissedAlerts = [],
    resetOnboarding = () => {},
  } = useWard() as WardContextType;

  const [isWardModalOpen, setIsWardModalOpen] = useState<boolean>(false);

  // Calculate unread alerts
  const unreadAlertsCount = alerts.filter(
    (alert) =>
      !readAlerts.includes(alert.id) && !dismissedAlerts.includes(alert.id),
  ).length;

  const mainNav: NavItem[] = [
    { name: t("home"), path: "/", icon: Home },
    { name: t("feed"), path: "/feed", icon: MessageSquare },
    { name: t("explore"), path: "/explore", icon: Compass },
    { name: t("sos"), path: "/sos", icon: ShieldAlert, isSOS: true },
    { name: t("profile"), path: "/profile", icon: User },
  ];

  const quickModules: NavItem[] = [
    { name: t("complaints"), path: "/complaints", icon: AlertTriangle },
    {
      name: t("alerts"),
      path: "/alerts",
      icon: Bell,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
    },
    { name: t("healthcare"), path: "/healthcare", icon: HeartPulse },
    { name: t("food"), path: "/food", icon: ChefHat },
    { name: t("services"), path: "/services", icon: Wrench },
    { name: t("rentals"), path: "/rentals", icon: Building2 },
    { name: t("jobs"), path: "/jobs", icon: Briefcase },
    { name: t("volunteers"), path: "/volunteers", icon: HeartHandshake },
    { name: t("transport"), path: "/transport", icon: Train },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-auto flex flex-col w-64 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-5 select-none shrink-0 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Logo & Mobile Close X */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              router.push("/");
              if (onClose) onClose();
            }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 p-0.5 shadow-md shadow-slate-200/50 dark:shadow-none flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/logo.png"
                alt="AVADI CITY Official Logo"
                className="w-full h-full object-cover object-center rounded-xl"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-slate-800 dark:text-slate-100 leading-none group-hover:text-primary transition-colors">
                AVADI CITY
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold tracking-wider mt-1 uppercase">
                HYPERLOCAL SUPER-APP
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden cursor-pointer flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Ward Widget */}
        <button
          onClick={() => {
            setIsWardModalOpen(true);
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-between p-3 mb-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left transition cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-primary flex items-center justify-center font-bold text-xs">
              W{activeWard.id}
            </div>
            <div className="flex flex-col max-w-[140px]">
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 leading-normal truncate">
                {activeWard.name}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                {activeWard.hints}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-orange-100/60 dark:bg-orange-950/30">
            {t("edit")}
          </span>
        </button>

        {/* Navigation - Main Group */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          <div>
            <span className="px-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {t("mainPages")}
            </span>
            <nav className="mt-2 space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.isSOS
                        ? isActive
                          ? "bg-rose-600 text-white shadow-md"
                          : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        : isActive
                          ? "bg-orange-500 text-white shadow-md"
                          : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={item.isSOS ? "animate-pulse" : ""}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <span className="px-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {t("quickUtilities")}
            </span>
            <nav className="mt-2 space-y-1">
              {quickModules.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-teal-700 text-white shadow-md"
                        : "text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-900/50">
            <button
              onClick={() => {
                resetOnboarding();
                if (onClose) onClose();
                router.push("/");
              }}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer text-left"
            >
              <LogOut size={16} className="shrink-0" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>

        {/* Footer Settings / Theme Toggle */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 uppercase">
              {activeWard.name ? activeWard.name[0] : "A"}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                Avadi Resident
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                Ward {activeWard.id}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={16} className="text-amber-400" />
              ) : (
                <Moon size={16} />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* <Modal
        isOpen={isWardModalOpen}
        onClose={() => setIsWardModalOpen(false)}
        title="Select Active Ward"
      >
        <WardSelector onClose={() => setIsWardModalOpen(false)} />
      </Modal> */}
    </>
  );
};

export default Sidebar;
