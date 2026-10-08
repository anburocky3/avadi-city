"use client";

import * as React from "react";
// Change the import from "next-themes" to "@teispace/next-themes"
import { ThemeProvider as NextThemesProvider } from "@teispace/next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="avadi-city-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
