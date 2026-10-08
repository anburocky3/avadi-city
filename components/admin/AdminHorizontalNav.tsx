"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  Activity,
  Layers,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Role, AuthSession } from "@/types/auth";

interface AdminHorizontalNavProps {
  session: AuthSession;
}

export function AdminHorizontalNav({ session }: AdminHorizontalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
      active: pathname === "/admin",
    },
    {
      name: "Complaints",
      href: "/admin/complaints",
      icon: FileText,
      exact: false,
      active: pathname.startsWith("/admin/complaints"),
    },
    {
      name: "Users Directory",
      href: "/admin/users",
      icon: Users,
      exact: false,
      active: pathname.startsWith("/admin/users"),
    },
    ...(isSuperAdmin
      ? [
          {
            name: "Super Admin",
            href: "/admin/super-admin",
            icon: ShieldCheck,
            exact: false,
            active: pathname.startsWith("/admin/super-admin"),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      {/* Upper Status Utility Bar */}
      <div className="hidden lg:flex items-center justify-between px-6 py-1 text-xs border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Avadi City Administration System Online
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>
            Scope:{" "}
            <strong className="text-slate-700 dark:text-slate-200">
              {isSuperAdmin ? "Global (All Wards 1-48)" : `Ward ${session.wardNumber}`}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            target="_blank"
            className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span>Public Resident Portal</span>
            <ExternalLink size={12} />
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Node: MariaDB-PROD
          </span>
        </div>
      </div>

      {/* Main Horizontal Navigation Bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-8">
          <Link
            href="/admin"
            className="group flex items-center gap-3 transition-transform active:scale-98"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <Building2 size={20} className="transition-transform group-hover:scale-110" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white">
                  Avadi City
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                    isSuperAdmin
                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40"
                      : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40"
                  }`}
                >
                  {isSuperAdmin ? "SUPER ADMIN" : "ADMIN PANEL"}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Municipal Corporation Portal
              </p>
            </div>
          </Link>

          {/* Desktop Horizontal Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                    link.active
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`transition-colors ${
                      link.active
                        ? "text-indigo-600 dark:text-indigo-300"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span>{link.name}</span>
                  {link.active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Utilities & User Menu */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {session.name || "Administrator"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {session.email}
              </span>
            </div>

            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs ring-2 ring-indigo-500/30">
              {(session.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign out of Admin Portal"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 dark:hover:border-rose-900/60 transition-all active:scale-95 disabled:opacity-50"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Exiting..." : "Sign Out"}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">
          <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {session.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {session.email} · {session.role}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                isSuperAdmin
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
              }`}
            >
              {session.role}
            </span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600"
            >
              <span>Switch to Public Resident View</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
