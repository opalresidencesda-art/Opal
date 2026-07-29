"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { OpalAIAssistant } from "@/components/opal-ai-assistant";

function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      closeButton
      position="top-center"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border-line !bg-surface-raised !text-ink !shadow-[0_18px_60px_rgba(3,25,21,0.18)]",
          title: "!font-bold",
          description: "!text-ink-muted",
          closeButton: "!border-line !bg-surface !text-ink",
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <OpalAIAssistant />
      <AppToaster />
    </ThemeProvider>
  );
}
