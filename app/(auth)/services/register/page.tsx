import React, { Suspense } from "react";
import { wards } from "@/data/wards";
import { RegisterClient } from "./register-client";

export const metadata = {
  title: "Register as Service Provider | Avadi City",
  description: "Register your skilled services with Avadi City Local Services network",
};

export default function ServiceRegisterPage() {
  const wardsList = (wards || []).map((w) => ({
    id: Number(w.id),
    name: w.name,
  }));

  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <RegisterClient wardsList={wardsList} />
    </Suspense>
  );
}
