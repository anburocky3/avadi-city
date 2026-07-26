"use client";
import React from "react";
import { Home, AlertTriangle, Compass, ShieldAlert, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface isActive {
  isActive: boolean;
}

export const BottomTabBar = () => {
  const t = useTranslations();
  const pathname = usePathname();

  const tabs = [
    { name: t("home"), path: "/", icon: Home },
    { name: t("complaints"), path: "/complaints", icon: AlertTriangle },
    { name: t("explore"), path: "/explore", icon: Compass },
    { name: t("sos.title"), path: "/sos", icon: ShieldAlert, isSOS: true },
    { name: t("profile"), path: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/98 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2.5 flex items-center justify-around  shadow-[0_-3px_12px_rgba(0,0,0,0.06)] h-16">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        if (tab.isSOS) {
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center justify-center -mt-6 w-13 h-13 rounded-full shadow-lg transition-transform active:scale-95 text-white ${
                pathname === tab.path
                  ? "bg-rose-600 ring-4 ring-rose-500/20 scale-105"
                  : "bg-rose-500 hover:bg-rose-600"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className="absolute w-11 h-11 rounded-full bg-rose-500/30 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <Icon size={20} className="relative z-10 animate-pulse" />
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center justify-center w-14 h-12 transition-all duration-200 ${
              pathname === tab.path
                ? "text-primary font-black scale-105"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100"
            }`}
          >
            <Icon size={19} />
            <span className="text-[9px] mt-1 tracking-wider uppercase font-bold truncate max-w-14 text-center">
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
export default BottomTabBar;
