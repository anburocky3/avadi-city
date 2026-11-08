import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import GetStartedClient from "@/features/auth/components/get-started-client";

export const metadata: Metadata = {
  title: "Get Started with Avadi City",
  description:
    "Create your Avadi City profile and start using local civic and community services.",
};

export default function GetStartedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Loading Citizen Setup...
            </span>
          </div>
        </div>
      }
    >
      <GetStartedClient />
    </Suspense>
  );
}
