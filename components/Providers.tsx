"use client";

import { ThemeProvider } from "next-themes";
import LoginBonus from "./LoginBonus";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <LoginBonus />
    </ThemeProvider>
  );
}
