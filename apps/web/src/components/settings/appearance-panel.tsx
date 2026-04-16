"use client";

import { cn } from "@collabsphere/ui/lib/utils";

import { useTheme } from "@/components/theme/theme-provider";
import type { ThemePreference } from "@/lib/theme";
import { SettingsSection } from "./settings-section";

const themes: Array<{ value: ThemePreference; title: string; description: string }> = [
  { value: "light", title: "Light", description: "Warm stone surfaces for daily productivity." },
  { value: "dark", title: "Dark", description: "Reduced glare for longer sessions." },
  { value: "system", title: "System", description: "Follow the operating system preference automatically." },
];

export function AppearancePanel() {
  const { preference, resolvedTheme, setThemePreference } = useTheme();

  return (
    <SettingsSection
      title="Appearance"
      description="Theme switching is live here and in the user menu. This is the first fully wired account preference in the reset shell."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {themes.map((theme) => {
          const active = preference === theme.value;
          return (
            <button
              key={theme.value}
              type="button"
              onClick={() => setThemePreference(theme.value)}
              aria-pressed={active}
              className={cn(
                "rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950",
                active
                  ? "border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/70"
                  : "border-stone-200 bg-stone-50/70 dark:border-stone-800 dark:bg-stone-900/70",
              )}
            >
              <p className="text-base font-semibold text-stone-900 dark:text-stone-100">{theme.title}</p>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{theme.description}</p>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                {theme.value === "system" ? `Resolved ${resolvedTheme}` : active ? "Active" : "Available"}
              </p>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}
