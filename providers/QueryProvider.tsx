"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize QueryClient inside useState so it is not re-created on SSR re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data stays fresh for 1 minute without refetching
            gcTime: 5 * 60 * 1000, // Unused cache garbage collected after 5 minutes
            refetchOnWindowFocus: true, // Refetch when resident returns to the tab
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools only appear in development mode */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
