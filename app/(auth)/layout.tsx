import React from "react";
import { WardProvider } from "@/context/wardContext";
import { AppShell } from "@/components/navigation/AppShell";
import QueryProvider from "@/providers/QueryProvider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // You can safely perform async server tasks here in the future if needed
  // e.g., const session = await getServerSession();
  // if (!session) redirect('/login');

  return (
    <QueryProvider>
      <WardProvider>
        <AppShell>{children}</AppShell>
      </WardProvider>
    </QueryProvider>
  );
}
