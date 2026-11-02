"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Send, Clock } from "lucide-react";
import SupportForm from "./SupportForm";
import SupportHistory from "./SupportHistory";

export default function SupportView() {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");

  return (
    <div className="space-y-6">
      {/* Page Header matching Avadi City design system */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            Support & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Notice a bug, incorrect transit schedule, or want to track the cleared status of past reports?
          </p>
        </div>

        {/* Citizen Helpdesk Pill */}
        <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20 shrink-0 w-fit">
          <LifeBuoy size={14} className="text-primary" />
          <span>Citizen Helpdesk</span>
        </span>
      </header>

      {/* Main Tabs Navigation */}
      <nav aria-label="Support Navigation" className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 max-w-md w-full gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "form"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Send size={14} className={activeTab === "form" ? "text-primary" : ""} />
          <span>Submit Feedback</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "history"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Clock size={14} className={activeTab === "history" ? "text-emerald-500" : ""} />
          <span>History & Status</span>
        </button>
      </nav>

      {/* Active Tab View */}
      <AnimatePresence mode="wait">
        {activeTab === "form" ? (
          <motion.section
            key="form-section"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            aria-label="Support Submission Form"
          >
            <SupportForm onViewHistory={() => setActiveTab("history")} />
          </motion.section>
        ) : (
          <motion.section
            key="history-section"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            aria-label="Support Ticket History"
          >
            <SupportHistory onNavigateToForm={() => setActiveTab("form")} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
