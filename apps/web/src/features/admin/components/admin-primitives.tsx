import { type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Admin primitives — Wave 3.
 *
 * The admin console must NOT look like a friendlier copy of the product.
 * It is operational, dense, red-accented, and slightly austere. These
 * primitives encode that identity:
 *
 * - AdminPageHeader   strict, monospace eyebrow with a red bar, optional
 *                     refresh action and last-updated timestamp.
 * - AdminTableShell   denser table chrome (sticky head, zebra rows,
 *                     compact 36px row height) used by Users / Workspaces /
 *                     Audit.
 * - SeverityChip      uniform mono chip used for severity + status across
 *                     every admin surface so the visual language is shared.
 * - AdminRail         vertical 2px red rail used for emphasis on stat cards
 *                     and dashboard widgets.
 */

/* ── PageHeader ─────────────────────────────────────────────────────────── */

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Right-aligned action slot. */
  actions?: ReactNode;
  /** Last-refreshed timestamp string (already formatted). */
  lastUpdated?: string;
  /** Refresh handler — renders an inline icon button when provided. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminPageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: AdminPageHeaderProps) => {
  return (
    <header className="border-b border-stone-200 pb-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-3 w-[3px] bg-red-600 rounded-sm" aria-hidden="true" />
            <span className="font-mono text-[10px] text-red-700 tracking-[0.22em] uppercase">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-[22px] font-bold text-stone-900 tracking-tight mt-2">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] text-stone-500 mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      </div>

      {(lastUpdated || onRefresh) && (
        <div className="mt-4 flex items-center gap-3 text-[11px]">
          {lastUpdated && (
            <span className="font-mono text-stone-400 tracking-wider tabular-nums">
              LAST UPDATED · {lastUpdated}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-stone-500 hover:text-red-700 disabled:opacity-40 transition-colors"
            >
              <RefreshCw
                className={cn("h-3 w-3", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              Refresh
            </button>
          )}
        </div>
      )}
    </header>
  );
};

/* ── Table shell ────────────────────────────────────────────────────────── */

interface AdminTableShellProps {
  caption?: string;
  /** Header row cells already wrapped in <th>. */
  head: ReactNode;
  /** Body rows. */
  children: ReactNode;
  /** Optional toolbar above the table. */
  toolbar?: ReactNode;
  /** Optional summary rendered between toolbar and table. */
  summary?: ReactNode;
  /** Minimum table width to enable horizontal scroll on small screens. */
  minWidth?: number;
}

export const AdminTableShell = ({
  caption,
  head,
  children,
  toolbar,
  summary,
  minWidth = 900,
}: AdminTableShellProps) => {
  return (
    <div className="rounded-lg border border-stone-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)] overflow-hidden">
      {toolbar && (
        <div className="px-3 py-2 border-b border-stone-200 bg-stone-50/60 flex flex-wrap items-center gap-2">
          {toolbar}
        </div>
      )}
      {summary && (
        <div className="px-3 py-1.5 border-b border-stone-100 bg-white flex items-center gap-3 text-[11px] text-stone-500">
          {summary}
        </div>
      )}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth }}
          aria-label={caption}
        >
          <thead className="sticky top-0 z-[1]">{head}</thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
};

/* Header row helpers — keeps every admin table visually identical. */

export const AdminTH = ({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) => (
  <th
    className={cn(
      "h-8 px-3 border-b border-stone-200 bg-stone-50/80 font-mono text-[10px] tracking-[0.14em] uppercase text-stone-500 font-semibold",
      align === "left" && "text-left",
      align === "right" && "text-right",
      align === "center" && "text-center",
      className,
    )}
  >
    {children}
  </th>
);

export const AdminTR = ({
  children,
  onClick,
  selected,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) => (
  <tr
    onClick={onClick}
    className={cn(
      "border-b border-stone-100 last:border-b-0 transition-colors duration-75",
      "odd:bg-white even:bg-stone-50/40",
      onClick && "cursor-pointer hover:!bg-red-50/40",
      selected && "!bg-red-50/60",
      className,
    )}
  >
    {children}
  </tr>
);

export const AdminTD = ({
  children,
  align = "left",
  mono,
  className,
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  mono?: boolean;
  className?: string;
}) => (
  <td
    className={cn(
      "px-3 py-2 align-middle text-[12px] text-stone-800",
      align === "right" && "text-right",
      align === "center" && "text-center",
      mono && "font-mono text-[11px] text-stone-700",
      className,
    )}
  >
    {children}
  </td>
);

/* ── Severity / status chips ────────────────────────────────────────────── */

type ChipTone =
  | "info"
  | "warn"
  | "error"
  | "success"
  | "neutral"
  | "admin"
  | "google"
  | "professional"
  | "academic";

interface SeverityChipProps {
  tone: ChipTone;
  children: ReactNode;
  /** Render a small leading dot. */
  dot?: boolean;
}

export const SeverityChip = ({ tone, children, dot }: SeverityChipProps) => {
  const styles: Record<ChipTone, string> = {
    info: "bg-stone-100 text-stone-600 border-stone-200",
    warn: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-700 border-red-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-stone-50 text-stone-500 border-stone-200",
    admin: "bg-amber-50 text-amber-700 border-amber-200",
    google: "bg-sky-50 text-sky-700 border-sky-200",
    professional: "bg-teal-50 text-teal-700 border-teal-200",
    academic: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const dotColor: Record<ChipTone, string> = {
    info: "bg-stone-400",
    warn: "bg-amber-500",
    error: "bg-red-500",
    success: "bg-emerald-500",
    neutral: "bg-stone-400",
    admin: "bg-amber-500",
    google: "bg-sky-500",
    professional: "bg-teal-500",
    academic: "bg-amber-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.1em] uppercase font-medium px-1.5 h-[18px] rounded-sm border tabular-nums",
        styles[tone],
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColor[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

/* ── Stat / KPI ─────────────────────────────────────────────────────────── */

interface KpiProps {
  label: string;
  value: ReactNode;
  /** Optional trend, e.g. "+4 this week" or "−2.1%". */
  delta?: string;
  /** Trend direction influences color. */
  deltaTone?: "up" | "down" | "neutral";
  /** Tiny right-aligned hint, e.g. "of 1,420". */
  hint?: string;
  /** Sparkline values 0..1 for the inline mini chart. */
  spark?: number[];
}

export const Kpi = ({
  label,
  value,
  delta,
  deltaTone = "neutral",
  hint,
  spark,
}: KpiProps) => {
  return (
    <div className="relative rounded-lg border border-stone-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)] overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-[2px] bg-red-600/80"
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-stone-500 tracking-[0.14em] uppercase font-semibold">
          {label}
        </span>
        {hint && (
          <span className="font-mono text-[10px] text-stone-400 tabular-nums">
            {hint}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[22px] font-bold text-stone-900 tabular-nums leading-none">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "font-mono text-[10px] tabular-nums tracking-wider",
              deltaTone === "up" && "text-emerald-600",
              deltaTone === "down" && "text-red-600",
              deltaTone === "neutral" && "text-stone-400",
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {spark && spark.length > 1 && <Sparkline values={spark} />}
    </div>
  );
};

const Sparkline = ({ values }: { values: number[] }) => {
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 0.0001);
  const w = 100;
  const h = 24;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="mt-3 h-6 w-full text-red-500/70"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

/* ── Section card ──────────────────────────────────────────────────────── */

interface AdminSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Compact heading style for ops widgets. */
  dense?: boolean;
}

export const AdminSection = ({
  title,
  description,
  action,
  children,
  dense,
}: AdminSectionProps) => (
  <section className="rounded-lg border border-stone-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)] overflow-hidden">
    <div
      className={cn(
        "flex items-center justify-between border-b border-stone-200 bg-stone-50/60",
        dense ? "px-3 py-2" : "px-4 py-3",
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            "font-semibold text-stone-900 tracking-tight",
            dense ? "text-[12px]" : "text-[13px]",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="text-[11px] text-stone-500 mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
);
