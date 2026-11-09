import React from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GuestFooter } from "@/components/navigation/GuestFooter";

interface LegalPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LegalPageShell({
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-primary dark:text-slate-400"
        >
          <ArrowLeft size={16} />
          Back to Avadi City
        </Link>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <header className="mb-8 border-b border-slate-100 pb-5 dark:border-slate-800">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {description}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Last updated: November 10, 2026
            </p>
          </header>
          <div className="space-y-7 text-sm leading-7 text-slate-600 dark:text-slate-300">
            {children}
          </div>
        </article>
      </main>
      <GuestFooter />
    </div>
  );
}
