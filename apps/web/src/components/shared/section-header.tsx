import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionHeader — second-tier hierarchy. Two visual systems so adjacent
 * sections on the same page do not all look the same:
 *
 * - "primary" — bold semibold heading, larger count chip. Use for the
 *               dominant section (left rail of asymmetric grids, the
 *               "Recent documents" main column).
 * - "rail"    — eyebrow rule with mono uppercase label. Use for the side
 *               rail or stacked sub-sections so they recede from the
 *               primary section.
 */
type SectionHeaderVariant = "primary" | "rail";

interface SectionHeaderProps {
  variant?: SectionHeaderVariant;
  title: string;
  /** Optional badge/count rendered next to the title. */
  count?: ReactNode;
  /** Optional right-aligned action (usually a "View all →" link). */
  action?: ReactNode;
  className?: string;
  /** id attached to the heading for aria-labelledby. */
  id?: string;
}

export const SectionHeader = ({
  variant = "primary",
  title,
  count,
  action,
  className,
  id,
}: SectionHeaderProps) => {
  if (variant === "rail") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 my-5",
          className,
        )}
      >
        <div className="h-px flex-1 bg-stone-100" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <h2
            id={id}
            className="font-mono text-[10px] text-stone-500 tracking-[0.2em] uppercase"
          >
            {title}
          </h2>
          {count}
        </div>
        <div className="h-px flex-1 bg-stone-100" aria-hidden="true" />
        {action && <div className="ml-1">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end justify-between gap-3 mb-3",
        className,
      )}
    >
      <div className="flex items-baseline gap-2.5 min-w-0">
        <h2
          id={id}
          className="text-[15px] font-semibold text-stone-900 tracking-tight"
        >
          {title}
        </h2>
        {count}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
