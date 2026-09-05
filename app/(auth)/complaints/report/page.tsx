"use client";

import ReportWizard from "@/components/ui/complaints/ReportWizard";
import { useRouter } from "next/navigation";

export default function ReportStandalonePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      {/* 
        The ReportWizard uses your shared Modal component which 
        will auto-center itself beautifully on this standalone page.
      */}
      <ReportWizard onClose={() => router.push("/complaints")} />
    </div>
  );
}
