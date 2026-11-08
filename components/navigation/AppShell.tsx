"use client";

import React, { useState } from "react";
import Sidebar from "@/components/navigation/Sidebar"; // Adjust path if needed
import Navbar from "@/components/navigation/Navbar";
import BottomTabBar from "@/components/navigation/BottomTabBar";
import { useWard } from "@/context/wardContext";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isLoadingAuth } = useWard();

  const handleMenuClick = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setIsSidebarCollapsed((collapsed) => !collapsed);
      return;
    }

    setIsSidebarOpen((open) => !open);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-250">
      {/* 1. Left Navigation Sidebar: Displayed on Desktop and Tablet */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Main Page View Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile top header: Active ward switcher, notification bell, theme toggle */}
        <Navbar onMenuClick={handleMenuClick} />

        {/* Center content slot: Scrollable with dynamic pages */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors pb-24 md:pb-8">
          {isLoadingAuth ? (
            <div
              className="min-h-full space-y-6 p-4 md:p-6"
              aria-busy="true"
              aria-label="Loading your Avadi City account"
            >
              <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-40 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile bottom tabs menu: Home, Ward Feed, Explore, SOS, Profile */}
        <BottomTabBar />
      </div>
    </div>
  );
};

export default AppShell;
