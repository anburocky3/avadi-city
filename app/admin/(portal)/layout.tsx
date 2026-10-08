import React from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { AdminHorizontalNav } from "@/components/admin/AdminHorizontalNav";
import QueryProvider from "@/providers/QueryProvider";

export const metadata = {
  title: {
    template: "%s | Avadi City Admin",
    default: "Admin Portal | Avadi City Municipal Corporation",
  },
  description: "Secure administrative management console for Avadi City Corporation.",
};

export default async function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    // Only users with at least ADMIN role can access the portal layout
    session = await requireRole("ADMIN");
  } catch {
    redirect("/admin/login");
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {/* Full-width Horizontal Admin Navigation Header */}
        <AdminHorizontalNav session={session} />

        {/* Horizontal Admin Content Area */}
        <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Horizontal Admin Footer */}
        <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-4 text-center text-xs text-slate-500 dark:text-slate-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Avadi City Municipal Corporation — Administration System</p>
            <p className="font-mono text-[11px]">Authorized Personnel Only · Secure Session Active</p>
          </div>
        </footer>
      </div>
    </QueryProvider>
  );
}
