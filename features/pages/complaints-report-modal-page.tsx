"use client";

import ReportWizard from "@/components/ui/complaints/ReportWizard";
import { useRouter } from "next/navigation";

export default function ReportModalIntercept() {
  const router = useRouter();

  return <ReportWizard onClose={() => router.back()} />;
}
