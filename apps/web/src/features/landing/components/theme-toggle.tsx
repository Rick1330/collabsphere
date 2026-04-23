import { Monitor, Moon, Sun } from "lucide-react";
import { useThemePreference, type ThemePreference } from "@/hooks/use-theme-preference";

/**
 * Compact 3-way appearance toggle (System / Light / Dark) for the landing page.
 *
 * Reads & writes through `useThemePreference`, which:
 *   - Defaults to "system" and tracks `prefers-color-scheme` live.
 *   - Persists manual overrides to localStorage.
 *   - Applies the resolved theme to <html> globally, so the rest of the app
 *     stays in sync the moment the user picks a new option here.
 */
const OPTIONS: Array<{ value: ThemePreference; label: string; Icon: typeof Sun }> = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="hidden sm:inline-flex items-center gap-0.5 rounded-full p-0.5"
      style={{
        background: "color-mix(in srgb, var(--cs-elevated) 70%, transparent)",
        border: "1px solid var(--cs-teal-faint)",
      }}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className="cs-focus inline-flex items-center justify-center h-7 w-7 rounded-full transition-colors duration-150"
            style={{
              background: active ? "var(--cs-surface)" : "transparent",
              color: active ? "var(--cs-text-headline)" : "var(--cs-text-muted)",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};
