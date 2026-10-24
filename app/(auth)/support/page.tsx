import React from "react";
import { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import SupportForm from "@/components/support/SupportForm";

export const metadata: Metadata = {
  title: "Support & Feedback | Avadi City",
  description:
    "Report bugs, suggest new civic features, or flag inaccuracies directly to the Avadi City Municipal Tech Team.",
};

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto md:max-w-full space-y-6 font-sans">
      {/* Page Header matching the Avadi City App design system */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
            Support & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Notice a bug, incorrect transit schedule, or have an idea to improve Avadi? Let us know.
          </p>
        </div>

        <span className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20 shrink-0 w-fit">
          <LifeBuoy size={14} className="text-primary" />
          <span>Citizen Helpdesk</span>
        </span>
      </header>

      {/* Dynamic Support Form */}
      <section aria-label="Support Submission Form">
        <SupportForm />
      </section>
    </div>
  );
}
