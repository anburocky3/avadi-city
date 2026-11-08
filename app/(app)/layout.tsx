import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import { WardProvider } from "@/context/wardContext";
import { AppShell } from "@/components/navigation/AppShell";
import QueryProvider from "@/providers/QueryProvider";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the session token from the incoming request cookies
  const cookieStore = await cookies();
  const token = cookieStore.get("avadi_session")?.value;

  // 2. If no token exists, immediately redirect to the login page
  if (!token) {
    redirect("/login");
  }

  // 3. Verify the token is valid and hasn't expired or been tampered with
  const payload = await verifyAuthToken(token);
  if (!payload || !payload.userId) {
    redirect("/login");
  }

  // 4. Render protected shell only if authentication checks pass
  return (
    <QueryProvider>
      <WardProvider>
        <AppShell>{children}</AppShell>
      </WardProvider>
    </QueryProvider>
  );
}
