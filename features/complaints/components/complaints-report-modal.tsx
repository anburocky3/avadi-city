"use client";

import ReportWizard from "@/features/complaints/components/ReportWizard";
import { useRouter } from "next/navigation";

export default function ReportModalInterceptClient() {
  const router = useRouter();

  return <ReportWizard onClose={() => router.back()} />;
}
