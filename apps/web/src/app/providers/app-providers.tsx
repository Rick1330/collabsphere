/**
 * App-level providers.
 *
 * Wraps the application with React Query, tooltip, toast providers, and
 * mounts the global theme listener so the resolved theme tracks the user's
 * system preference live (when their preference is "system") and applies
 * any manual override they've chosen on every page — not just settings.
 */
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useThemePreference } from "@/hooks/use-theme-preference";

const queryClient = new QueryClient();

/** Mount-only component so the theme hook runs once at the root. */
function ThemeListener() {
  useThemePreference();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeListener />
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
