import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  /** Tiny eyebrow label shown above the title. */
  eyebrow?: string;
  description?: string;
  /** Optional right-aligned action (link or small button). */
  action?: ReactNode;
  /** Visual treatment. "danger" tints the header for destructive surfaces. */
  tone?: "default" | "danger";
  children: ReactNode;
}

export const SettingsSection = ({
  title,
  eyebrow,
  description,
  action,
  tone = "default",
  children,
}: SettingsSectionProps) => {
  const isDanger = tone === "danger";
  return (
    <section
      className={cn(
        "rounded-xl border bg-white shadow-[0_1px_3px_rgba(28,25,23,0.04),0_1px_2px_rgba(28,25,23,0.02)]",
        isDanger ? "border-red-200/70" : "border-stone-200",
      )}
    >
      <header
        className={cn(
          "px-6 pt-5 pb-5 flex items-start justify-between gap-4",
          isDanger && "bg-gradient-to-b from-red-50/40 to-transparent rounded-t-xl",
        )}
      >
        <div className="min-w-0">
          {eyebrow && (
            <span
              className={cn(
                "font-mono text-[10px] tracking-[0.2em] uppercase block mb-1.5",
                isDanger ? "text-red-600" : "text-stone-400",
              )}
            >
              {eyebrow}
            </span>
          )}
          <h2
            className={cn(
              "text-base font-semibold tracking-tight",
              isDanger ? "text-red-900" : "text-stone-900",
            )}
          >
            {title}
          </h2>
          {description && (
            <p
              className={cn(
                "mt-1 text-sm",
                isDanger ? "text-red-700/80" : "text-stone-500",
              )}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </header>
      <div
        className={cn(
          "border-t",
          isDanger ? "border-red-100" : "border-stone-100",
        )}
      />
      <div className="p-6">{children}</div>
    </section>
  );
};
