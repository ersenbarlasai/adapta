"use client";

import { useEffect } from "react";

interface ThemeProviderProps {
  primaryColor: string;
  children: React.ReactNode;
}

export function ThemeProvider({ primaryColor, children }: ThemeProviderProps) {
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty("--primary-color", primaryColor);
    }
  }, [primaryColor]);

  return <>{children}</>;
}
