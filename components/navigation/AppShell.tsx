"use client";

import React, { useState } from "react";
import Sidebar from "@/components/navigation/Sidebar"; // Adjust path if needed
import Navbar from "@/components/navigation/Navbar";
import BottomTabBar from "@/components/navigation/BottomTabBar";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 transition-colors duration-250">
      {/* 1. Left Navigation Sidebar: Displayed on Desktop and Tablet */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 2. Main Page View Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile top header: Active ward switcher, notification bell, theme toggle */}
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Center content slot: Scrollable with dynamic pages */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors pb-20 md:pb-6">
          {children}
        </main>

        {/* Mobile bottom tabs menu: Home, Ward Feed, Explore, SOS, Profile */}
        <BottomTabBar />
      </div>
    </div>
  );
};

export default AppShell;
