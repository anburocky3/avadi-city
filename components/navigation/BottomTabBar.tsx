"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, AlertTriangle, Compass, ShieldAlert, User } from "lucide-react";
import { useWard } from "@/context/wardContext";

interface TabItem {
  name: string;
  path: string;
  icon: React.ElementType;
  isSOS?: boolean;
  isProfile?: boolean;
}

export const BottomTabBar: React.FC = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const { authUser } = useWard();

  // Strict single-word labels prevent mobile text truncation
  const tabs: TabItem[] = [
    { name: t("bottomTabs.home") || "Home", path: "/dashboard", icon: Home },
    {
      name: t("bottomTabs.complaint") || "Complaint",
      path: "/complaints",
      icon: AlertTriangle,
    },
    {
      name: t("bottomTabs.explore") || "Explore",
      path: "/explore",
      icon: Compass,
    },
    {
      name: t("bottomTabs.sos") || "SOS",
      path: "/sos",
      icon: ShieldAlert,
      isSOS: true,
    },
    {
      name:
        (authUser?.name && `${authUser.name.split(" ")[0]}`) ||
        t("profile") ||
        "Profile",
      path: "/profile",
      icon: User,
      isProfile: true,
    },
  ];

  const renderTabIcon = (tab: TabItem, isActive: boolean) => {
    if (tab.isProfile) {
      const avatarUrl =
        (authUser as any)?.avatarUrl || (authUser as any)?.avatar;
      const initials = authUser?.name
        ? authUser.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "AR";

      if (avatarUrl) {
        return (
          <div
            className={`relative w-6 h-6 rounded-full overflow-hidden ring-2 transition-all duration-200 ${
              isActive
                ? "ring-orange-500 scale-110 shadow-sm"
                : "ring-slate-300 dark:ring-slate-700 opacity-80"
            }`}
          >
            <Image
              src={avatarUrl}
              alt={authUser?.name || "Profile"}
              fill
              sizes="24px"
              className="object-cover"
            />
          </div>
        );
      }

      return (
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black tracking-tighter transition-all duration-200 ${
            isActive
              ? "bg-linear-to-tr from-orange-500 to-amber-500 text-white ring-2 ring-orange-500/30 scale-110 shadow-sm"
              : "bg-linear-to-tr from-indigo-600 via-purple-600 to-violet-600 text-white dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 "
          }`}
        >
          {initials}
        </div>
      );
    }

    const Icon = tab.icon;
    return (
      <Icon
        size={20}
        className={`transition-transform duration-200 ${
          isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.75]"
        }`}
      />
    );
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/80 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center w-full max-w-md mx-auto h-16 px-1">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.path ||
            (tab.path !== "/" && pathname.startsWith(tab.path));

          // 1. Clean Floating SOS Button (No Text Label)
          if (tab.isSOS) {
            const Icon = tab.icon;
            return (
              <div key={tab.path} className="flex items-center justify-center">
                <Link
                  href={tab.path}
                  className="group relative flex items-center justify-center -top-4 w-12 h-12 rounded-full bg-linear-to-tr from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-white dark:ring-slate-950 transition-all active:scale-95 focus:outline-none"
                  aria-label="Emergency SOS"
                >
                  <span
                    className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping pointer-events-none"
                    style={{ animationDuration: "3s" }}
                  />
                  <Icon
                    size={22}
                    className="relative z-10 animate-pulse drop-shadow-sm"
                  />
                </Link>
              </div>
            );
          }

          // 2. Minimalist Standard Tabs
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center justify-center py-1 transition-colors duration-200 focus:outline-none ${
                isActive
                  ? "text-orange-500 dark:text-orange-400"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <div className="relative flex items-center justify-center w-6 h-6">
                {renderTabIcon(tab, isActive)}
              </div>

              <span
                className={`text-[11px] mt-2 tracking-tight leading-none transition-all ${
                  isActive
                    ? "font-extrabold text-orange-600 dark:text-orange-400"
                    : "font-medium"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabBar;
