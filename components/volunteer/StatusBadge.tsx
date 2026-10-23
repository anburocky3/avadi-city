"use client";

import React from "react";
import { Droplet, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { VolunteerStatus } from "@/types/volunteer";
import { DonationStatus, DonationUrgency } from "@/types/donation";

export interface StatusBadgeProps {
  type?: "volunteerStatus" | "urgency" | "donationStatus" | "bloodGroup";
  value: VolunteerStatus | DonationStatus | DonationUrgency | string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = "donationStatus",
  value,
  className = "",
  showIcon = true,
}) => {
  // Blood group badge
  if (type === "bloodGroup") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-[10px] font-black tracking-tight ${className}`}
      >
        {showIcon && <Droplet size={11} className="fill-rose-500 text-rose-500" />}
        <span>{value}</span>
      </span>
    );
  }

  // Urgency badge
  if (type === "urgency") {
    const val = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (val === "critical") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm shadow-rose-500/20 animate-pulse ${className}`}
        >
          {showIcon && <AlertTriangle size={11} strokeWidth={2.5} />}
          <span>Critical Need</span>
        </span>
      );
    }
    if (val === "urgent") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm shadow-amber-500/20 ${className}`}
        >
          {showIcon && <Clock size={11} strokeWidth={2.5} />}
          <span>Urgent</span>
        </span>
      );
    }
    // Normal or unspecified urgency: do not render any badge
    return null;
  }

  // Volunteer status
  if (type === "volunteerStatus") {
    const s = typeof value === "string" ? value.trim().toLowerCase() : "";
    switch (s) {
      case "pending":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold uppercase tracking-wider ${className}`}
          >
            <Clock size={11} className="text-amber-600 animate-pulse" />
            <span>Pending Approval</span>
          </span>
        );
      case "approved":
      case "active":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold uppercase tracking-wider ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Force</span>
          </span>
        );
      case "paused":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold uppercase tracking-wider ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Paused</span>
          </span>
        );
      case "left":
      default:
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Inactive</span>
          </span>
        );
    }
  }

  // Donation status
  switch (value) {
    case "approved":
      return null;
    case "pending":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold ${className}`}
        >
          {showIcon && <Clock size={11} />}
          <span>Pending Review</span>
        </span>
      );
    case "fulfilled":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 text-[10px] font-bold ${className}`}
        >
          {showIcon && <CheckCircle2 size={11} />}
          <span>Fulfilled</span>
        </span>
      );
    case "rejected":
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[10px] font-bold ${className}`}
        >
          {showIcon && <XCircle size={11} />}
          <span>Rejected</span>
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium ${className}`}
        >
          <span>{value}</span>
        </span>
      );
  }
};

export default StatusBadge;
