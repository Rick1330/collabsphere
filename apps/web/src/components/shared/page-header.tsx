import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — the single source of hierarchy for every authenticated page.
 *
 * Three variants, deliberately different so index pages, contextual pages,
 * and editorial flows do not look interchangeable:
 *
 * - "index"      — top-level surfaces (Workspaces, Notifications). Confident
 *                  H1, eyebrow label, optional count chip, primary actions
 *                  on the right.
 * - "contextual" — page nested inside a workspace (Workspace Home, Documents,
 *                  Members). Adds an icon/avatar block, type/role badges, and
 *                  a thin meta strip below the title with breadcrumbs and
 *                  workspace context.
 * - "compact"    — for surfaces that need a tight, dense header (Task board,
 *                  Task list — uses its own toolbar). Just the essentials.
 *
 * The meta strip (children passed to `meta`) is the rhythm element that breaks
 * the "every page header looks identical" failure mode.
 */
export type PageHeaderVariant = "index" | "contextual" | "compact";

interface PageHeaderProps {
  variant?: PageHeaderVariant;
  /** Tiny uppercase eyebrow label rendered above the title. */
  eyebrow?: string;
  /** Required title — keep short, no trailing punctuation. */
  title: string;
  /** Optional one-line description. */
  description?: string;
  /** Icon block on the left (emoji char or React node). Contextual variant only. */
  icon?: ReactNode;
  /** Type / role badges or status pills shown next to the title. */
  badges?: ReactNode;
  /** Primary actions on the right (buttons, links). */
  actions?: ReactNode;
  /** Tertiary meta strip below the title — breadcrumbs, counts, hints. */
  meta?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  variant = "index",
  eyebrow,
  title,
  description,
  icon,
  badges,
  actions,
  meta,
  className,
}: PageHeaderProps) => {
  const isContextual = variant === "contextual";
  const isCompact = variant === "compact";

  return (
    <header className={cn("w-full", className)}>
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
          isCompact && "gap-3 sm:items-center",
        )}
      >
        <div className="flex items-start gap-4 min-w-0">
          {isContextual && icon && (
            <div
              className="h-11 w-11 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center text-[20px] flex-shrink-0"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <span className="font-mono text-[10px] text-stone-400 tracking-[0.2em] uppercase block mb-1.5">
                {eyebrow}
              </span>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <h1
                className={cn(
                  "text-stone-900 tracking-tight font-bold",
                  isCompact ? "text-lg" : "text-2xl sm:text-[26px]",
                )}
              >
                {title}
              </h1>
              {badges}
            </div>

            {description && (
              <p
                className={cn(
                  "text-stone-500 mt-1.5 max-w-2xl",
                  isCompact ? "text-xs" : "text-[13px] sm:text-sm",
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Meta strip — the rhythm element that breaks page-header sameness */}
      {meta && (
        <div
          className={cn(
            "mt-4 pt-4 border-t border-stone-100",
            "flex items-center gap-3 sm:gap-5 flex-wrap",
            "text-[11px] text-stone-500",
          )}
        >
          {meta}
        </div>
      )}
    </header>
  );
};

/* ── Small composables for the meta strip ──────────────────────────────── */

interface MetaStatProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | number;
}

export const MetaStat = ({ icon: Icon, label, value }: MetaStatProps) => (
  <span className="inline-flex items-center gap-1.5">
    {Icon && <Icon className="h-3 w-3 text-stone-400" aria-hidden="true" />}
    {value !== undefined && (
      <span className="font-medium text-stone-700 tabular-nums">{value}</span>
    )}
    <span className="text-stone-500">{label}</span>
  </span>
);

export const MetaDivider = () => (
  <span
    className="h-3 w-px bg-stone-200"
    aria-hidden="true"
  />
);

interface CountChipProps {
  value: number | string;
  tone?: "neutral" | "teal" | "amber";
  label?: string;
}

export const CountChip = ({
  value,
  tone = "neutral",
  label,
}: CountChipProps) => (
  <span
    aria-label={label}
    className={cn(
      "inline-flex items-center justify-center font-mono text-[11px] tracking-wider px-2 py-0.5 rounded-full border tabular-nums",
      tone === "neutral" &&
        "bg-stone-100 border-stone-200 text-stone-600",
      tone === "teal" &&
        "bg-teal-50 border-teal-200 text-teal-700",
      tone === "amber" &&
        "bg-amber-50 border-amber-200 text-amber-700",
    )}
  >
    {value}
  </span>
);
