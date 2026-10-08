"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
  UtensilsCrossed,
  Wrench,
  Home,
  Briefcase,
  Compass,
  HeartPulse,
  Bus,
  HelpingHand,
  Search,
  LifeBuoy,
  BellRing,
  Rss,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AuthSession } from "@/types/auth";

interface AdminHorizontalNavProps {
  session: AuthSession;
  pendingApprovalsCount?: {
    foods?: number;
    services?: number;
    rentals?: number;
  };
}

export function AdminHorizontalNav({
  session,
  pendingApprovalsCount = { foods: 0, services: 0, rentals: 0 },
}: AdminHorizontalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const navGroups = [
    {
      id: "services",
      name: "Citizen Services",
      icon: LifeBuoy,
      active:
        pathname.startsWith("/admin/feeds") ||
        pathname.startsWith("/admin/complaints") ||
        pathname.startsWith("/admin/lost-found") ||
        pathname.startsWith("/admin/support"),
      items: [
        {
          name: "Community Feed",
          href: "/admin/feeds",
          icon: Rss,
          description: "Moderate neighborhood posts & emergency notices",
          badge: null,
        },
        {
          name: "Grievances & Complaints",
          href: "/admin/complaints",
          icon: FileText,
          description: "Track, escalate, and resolve citizen issues",
          badge: null,
        },
        {
          name: "Lost & Found",
          href: "/admin/lost-found",
          icon: Search,
          description: "Manage reported items and claims",
          badge: null,
        },
        {
          name: "Support & Inquiries",
          href: "/admin/support",
          icon: LifeBuoy,
          description: "Citizen helpdesk & official contact inquiries",
          badge: null,
        },
      ],
    },
    {
      id: "commerce",
      name: "Approvals & Commerce",
      icon: UtensilsCrossed,
      active:
        pathname.startsWith("/admin/foods") ||
        pathname.startsWith("/admin/services") ||
        pathname.startsWith("/admin/rentals") ||
        pathname.startsWith("/admin/jobs"),
      items: [
        {
          name: "Food & Dining",
          href: "/admin/foods",
          icon: UtensilsCrossed,
          description: "Review restaurants & approve dishes for public view",
          badge:
            (pendingApprovalsCount?.foods ?? 0) > 0
              ? `${pendingApprovalsCount?.foods} Pending`
              : "Approvals",
          badgeColor:
            (pendingApprovalsCount?.foods ?? 0) > 0 ? "amber" : "indigo",
        },
        {
          name: "Local Services",
          href: "/admin/services",
          icon: Wrench,
          description: "Verify plumbers, electricians & technicians",
          badge:
            (pendingApprovalsCount?.services ?? 0) > 0
              ? `${pendingApprovalsCount?.services} Pending`
              : null,
          badgeColor: "amber",
        },
        {
          name: "Rent & Properties",
          href: "/admin/rentals",
          icon: Home,
          description: "Approve commercial and residential listings",
          badge:
            (pendingApprovalsCount?.rentals ?? 0) > 0
              ? `${pendingApprovalsCount?.rentals} Pending`
              : null,
          badgeColor: "amber",
        },
        {
          name: "Job Vacancies",
          href: "/admin/jobs",
          icon: Briefcase,
          description: "Local job postings and hiring drives",
          badge: null,
        },
      ],
    },
    {
      id: "directory",
      name: "City Directory",
      icon: Compass,
      active:
        pathname.startsWith("/admin/explore") ||
        pathname.startsWith("/admin/healthcare") ||
        pathname.startsWith("/admin/transport") ||
        pathname.startsWith("/admin/volunteers"),
      items: [
        {
          name: "Explore Places",
          href: "/admin/explore",
          icon: Compass,
          description: "Parks, heritage sites, and municipal landmarks",
          badge: null,
        },
        {
          name: "Hospitals & Pharmacies",
          href: "/admin/healthcare",
          icon: HeartPulse,
          description: "Healthcare centers, 24/7 clinics, and blood banks",
          badge: null,
        },
        {
          name: "Travel & Transport",
          href: "/admin/transport",
          icon: Bus,
          description: "MTC bus timetables, trains, and auto stands",
          badge: null,
        },
        {
          name: "Volunteers & Causes",
          href: "/admin/volunteers",
          icon: HelpingHand,
          description: "Civic volunteering initiatives & donation drives",
          badge: null,
        },
      ],
    },
    {
      id: "broadcast",
      name: "Broadcast & Admin",
      icon: BellRing,
      active:
        pathname.startsWith("/admin/notifications") ||
        pathname.startsWith("/admin/users") ||
        pathname.startsWith("/admin/super-admin"),
      items: [
        {
          name: "Push Notifications",
          href: "/admin/notifications",
          icon: BellRing,
          description: "Broadcast civic alerts & notifications to all users",
          badge: "Broadcast",
          badgeColor: "rose",
        },
        {
          name: "User Directory",
          href: "/admin/users",
          icon: Users,
          description: "Manage registered residents, wards & credentials",
          badge: null,
        },
        ...(isSuperAdmin
          ? [
              {
                name: "Super Admin Console",
                href: "/admin/super-admin",
                icon: ShieldCheck,
                description: "Full-platform control, roles & database nodes",
                badge: "Root Access",
                badgeColor: "emerald",
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors shadow-xs">
      {/* Main Horizontal Navigation Bar */}
      <div
        ref={navContainerRef}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        {/* Brand & Emblem */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link
            href="/admin/dashboard"
            className="group flex items-center gap-3 transition-transform active:scale-98"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <Building2
                size={20}
                className="transition-transform group-hover:scale-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white text-base">
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
                Community app
              </p>
            </div>
          </Link>
        </div>

        {/* Right Action Utilities & User Menu */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {session.name || "Administrator"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {session.email}
              </span>
            </div>

            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-indigo-700 to-violet-700 text-white font-bold text-xs ring-2 ring-indigo-500/30">
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
            <LogOut size={13} />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Exiting..." : "Sign Out"}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Desktop Horizontal Navigation Links with Sub-menus */}
        <nav className="hidden lg:flex items-center gap-1 ml-2">
          {/* 1. Dashboard Direct Link */}
          <Link
            href="/admin/dashboard"
            className={`group relative flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              pathname === "/admin/dashboard" || pathname === "/admin"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
            {(pathname === "/admin/dashboard" || pathname === "/admin") && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </Link>

          {/* 2. Dropdown Groups */}
          {navGroups.map((group) => {
            const Icon = group.icon;
            const isOpen = openDropdown === group.id;

            return (
              <div key={group.id} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  className={`group relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    group.active || isOpen
                      ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon size={15} />
                  <span>{group.name}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400"
                    }`}
                  />
                  {group.active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>

                {/* Dropdown Menu Popup */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="space-y-1">
                      {group.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname.startsWith(subItem.href);

                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setOpenDropdown(null)}
                            className={`group flex items-start gap-3 p-2.5 rounded-lg text-xs transition-colors ${
                              isSubActive
                                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-medium"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                            }`}
                          >
                            <div
                              className={`mt-0.5 p-1.5 rounded-md ${
                                isSubActive
                                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-slate-700"
                              }`}
                            >
                              <SubIcon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {subItem.name}
                                </span>
                                {subItem.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                      subItem.badgeColor === "amber"
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                                        : subItem.badgeColor === "rose"
                                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
                                          : subItem.badgeColor === "emerald"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                                            : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300"
                                    }`}
                                  >
                                    {subItem.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {subItem.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden max-h-[80vh] overflow-y-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {session.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {session.email} ·{" "}
                {isSuperAdmin ? "Super Admin" : `Ward ${session.wardNumber}`}
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

          <Link
            href="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/admin/dashboard" || pathname === "/admin"
                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {/* Grouped Menus */}
          {navGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                {group.name}
              </p>
              {group.items.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = pathname.startsWith(subItem.href);

                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSubActive
                        ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <SubIcon size={17} />
                      <span>{subItem.name}</span>
                    </div>
                    {subItem.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 uppercase">
                        {subItem.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/dashboard"
              target="_blank"
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
