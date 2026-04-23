import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { useThemePreference, type ThemePreference } from "@/hooks/use-theme-preference";
import { cn } from "@/lib/utils";

export const AppearanceForm = () => {
  const { preference, resolvedTheme, setPreference } = useThemePreference();

  return (
    <SettingsSection title="Appearance" description="Choose how CollabSphere looks for you.">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ThemeCard
          icon={Sun}
          title="Light"
          description="Clean and bright"
          isSelected={preference === "light"}
          onSelect={() => setPreference("light")}
        />
        <ThemeCard
          icon={Moon}
          title="Dark"
          description="Easy on the eyes"
          isSelected={preference === "dark"}
          onSelect={() => setPreference("dark")}
        />
        <ThemeCard
          icon={Monitor}
          title="System"
          description="Follows your OS"
          isSelected={preference === "system"}
          onSelect={() => setPreference("system")}
        />
      </div>
      <p className="mt-5 text-[13px] text-stone-500 dark:text-stone-400">
        {preference === "system"
          ? `Currently using ${resolvedTheme} mode based on your system preference.`
          : `Using ${preference} mode.`}
      </p>
    </SettingsSection>
  );
};

interface ThemeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

const ThemeCard = ({ icon: Icon, title, description, isSelected, onSelect }: ThemeCardProps) => (
  <button
    type="button"
    aria-pressed={isSelected}
    onClick={onSelect}
    className={cn(
      "group flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:ring-offset-1",
      isSelected
        ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60",
    )}
  >
    <span
      className={cn(
        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
        isSelected ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200",
      )}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <p className={cn("text-sm font-semibold", isSelected ? "text-teal-700" : "text-stone-900")}>{title}</p>
      <p className="mt-0.5 text-[12px] text-stone-500">{description}</p>
    </div>
  </button>
);

// Avoid unused import warning when ThemePreference isn't directly referenced
void (null as unknown as ThemePreference);
