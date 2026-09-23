import React, { Suspense } from "react";
import { ServiceRegisterClient } from "./service-register-client";

export const metadata = {
  title: "Register as Service Provider | Avadi City",
  description:
    "Register your skilled services with Avadi City Local Services network",
};

export default function ServiceRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <ServiceRegisterClient />
    </Suspense>
  );
}
