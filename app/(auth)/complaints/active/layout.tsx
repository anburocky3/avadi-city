"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useWard } from "@/context/wardContext";
import Link from "next/link";

export default function ActiveComplaintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeWard } = useWard();

  const isMyComplaints = pathname === "/complaints/active";
  const nearbyUrl = `/complaints/active/w${activeWard.id}`;
  const isNearby = pathname.startsWith("/complaints/active/w");

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <button
            onClick={() => router.push("/complaints")}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm font-extrabold text-primary hover:underline cursor-pointer mb-1"
          >
            <ArrowLeft size={16} />
            <span>Back to Overview</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            Active Ward Grievances
          </h1>
        </div>

        {/* URL-Driven Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto">
          <Link
            href="/complaints/active"
            className={`flex-1 px-4 py-3 text-center text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${isMyComplaints ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
          >
            My Complaints
          </Link>
          <Link
            href={nearbyUrl}
            className={`flex-1 px-4 py-3 text-center text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${isNearby ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"}`}
          >
            Nearby W{activeWard.id}
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}
