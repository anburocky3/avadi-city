"use client";

import React from "react";
import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  HeartPulse,
  Building2,
  ExternalLink,
} from "lucide-react";

export function HomeFooter() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black flex items-center justify-center text-xs">
            A
          </div>
          <div>
            <span className="font-black text-sm text-slate-900 dark:text-white block">
              AVADI <span className="text-orange-500">CITY APP</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Empowering 48 Municipal Wards of Avadi
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <Link
            href="/sos"
            className="hover:text-orange-500 transition flex items-center gap-1"
          >
            <ShieldCheck size={14} className="text-rose-500" />
            <span>Emergency SOS</span>
          </Link>

          <Link
            href="/healthcare"
            className="hover:text-orange-500 transition flex items-center gap-1"
          >
            <HeartPulse size={14} className="text-emerald-500" />
            <span>Healthcare Directory</span>
          </Link>

          <Link
            href="/contact"
            className="hover:text-orange-500 transition flex items-center gap-1 font-black text-orange-600 dark:text-orange-400"
          >
            <Mail size={14} />
            <span>Contact & Support</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
