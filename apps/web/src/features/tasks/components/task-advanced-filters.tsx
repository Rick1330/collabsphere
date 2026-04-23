import { useState } from "react";
import { Filter, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type TaskAssignee, type TaskPriority, type TaskStatus } from "@/api/adapters/tasks";

export interface AdvancedFilterState {
  statuses: TaskStatus[];
  assignees: string[]; // member ids; "__unassigned" allowed
  priorities: TaskPriority[];
  labels: string[];
  dueAfter: string | null;  // YYYY-MM-DD
  dueBefore: string | null;
}

export const EMPTY_FILTERS: AdvancedFilterState = {
  statuses: [],
  assignees: [],
  priorities: [],
  labels: [],
  dueAfter: null,
  dueBefore: null,
};

export function activeFilterCount(f: AdvancedFilterState): number {
  return (
    f.statuses.length +
    f.assignees.length +
    f.priorities.length +
    f.labels.length +
    (f.dueAfter ? 1 : 0) +
    (f.dueBefore ? 1 : 0)
  );
}

interface Props {
  value: AdvancedFilterState;
  onChange: (next: AdvancedFilterState) => void;
  members: TaskAssignee[];
  allLabels: string[];
  /** Hide statuses entirely if the surface only shows board columns. */
  showStatus?: boolean;
}

const ALL_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];
const ALL_PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];

export const TaskAdvancedFilters = ({
  value,
  onChange,
  members,
  allLabels,
  showStatus = true,
}: Props) => {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(value);

  const toggle = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 px-2.5 rounded-lg border text-[12px] font-medium transition-colors duration-150 flex items-center gap-1.5",
            count > 0
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-white text-stone-500 border-stone-200 hover:text-stone-700 hover:bg-stone-50",
          )}
          aria-label="Advanced filters"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {count > 0 && (
            <span className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[320px] p-0 bg-white border-stone-200"
      >
        <div className="px-3 py-2.5 border-b border-stone-100 flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
            Advanced filters
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-3 py-3 space-y-4">
          {showStatus && (
            <Section title="Status">
              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <Chip
                    key={s}
                    active={value.statuses.includes(s)}
                    onClick={() =>
                      onChange({ ...value, statuses: toggle(value.statuses, s) })
                    }
                  >
                    {STATUS_LABELS[s]}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          <Section title="Priority">
            <div className="flex flex-wrap gap-1.5">
              {ALL_PRIORITIES.map((p) => (
                <Chip
                  key={p}
                  active={value.priorities.includes(p)}
                  onClick={() =>
                    onChange({ ...value, priorities: toggle(value.priorities, p) })
                  }
                >
                  {p[0].toUpperCase() + p.slice(1)}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Assignee">
            <div className="flex flex-col gap-1">
              <Row
                checked={value.assignees.includes("__unassigned")}
                label="Unassigned"
                onClick={() =>
                  onChange({
                    ...value,
                    assignees: toggle(value.assignees, "__unassigned"),
                  })
                }
              />
              {members.map((m) => (
                <Row
                  key={m.id}
                  checked={value.assignees.includes(m.id)}
                  label={m.fullName}
                  onClick={() =>
                    onChange({ ...value, assignees: toggle(value.assignees, m.id) })
                  }
                />
              ))}
            </div>
          </Section>

          {allLabels.length > 0 && (
            <Section title="Labels">
              <div className="flex flex-wrap gap-1.5">
                {allLabels.map((l) => (
                  <Chip
                    key={l}
                    active={value.labels.includes(l)}
                    onClick={() =>
                      onChange({ ...value, labels: toggle(value.labels, l) })
                    }
                  >
                    {l}
                  </Chip>
                ))}
              </div>
            </Section>
          )}

          <Section title="Due date">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  After
                </span>
                <input
                  type="date"
                  value={value.dueAfter ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, dueAfter: e.target.value || null })
                  }
                  className="w-full mt-0.5 h-8 rounded-md border border-stone-200 bg-white px-2 text-[12px] text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  Before
                </span>
                <input
                  type="date"
                  value={value.dueBefore ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, dueBefore: e.target.value || null })
                  }
                  className="w-full mt-0.5 h-8 rounded-md border border-stone-200 bg-white px-2 text-[12px] text-stone-700 focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 focus:outline-none"
                />
              </label>
            </div>
          </Section>
        </div>

        <div className="border-t border-stone-100 px-3 py-2 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-7 px-2.5 rounded-md text-[11px] font-medium text-stone-700 hover:bg-stone-100"
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="text-[10px] font-mono tracking-wider uppercase text-stone-400 mb-1.5">
      {title}
    </div>
    {children}
  </div>
);

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "text-[11px] font-medium px-2 py-1 rounded-full border transition-colors",
      active
        ? "bg-teal-600 border-teal-600 text-white"
        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50",
    )}
  >
    {children}
  </button>
);

const Row = ({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-stone-50 text-left"
  >
    <span
      className={cn(
        "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
        checked
          ? "bg-teal-600 border-teal-600 text-white"
          : "bg-white border-stone-300",
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </span>
    <span className="text-[12px] text-stone-700 truncate">{label}</span>
  </button>
);

export const ActiveFilterPills = ({
  value,
  onChange,
  members,
}: {
  value: AdvancedFilterState;
  onChange: (n: AdvancedFilterState) => void;
  members: TaskAssignee[];
}) => {
  const pills: Array<{ key: string; label: string; onRemove: () => void }> = [];
  for (const s of value.statuses)
    pills.push({
      key: `s-${s}`,
      label: STATUS_LABELS[s],
      onRemove: () =>
        onChange({ ...value, statuses: value.statuses.filter((x) => x !== s) }),
    });
  for (const p of value.priorities)
    pills.push({
      key: `p-${p}`,
      label: p[0].toUpperCase() + p.slice(1),
      onRemove: () =>
        onChange({
          ...value,
          priorities: value.priorities.filter((x) => x !== p),
        }),
    });
  for (const a of value.assignees) {
    const label =
      a === "__unassigned"
        ? "Unassigned"
        : members.find((m) => m.id === a)?.fullName ?? a;
    pills.push({
      key: `a-${a}`,
      label,
      onRemove: () =>
        onChange({
          ...value,
          assignees: value.assignees.filter((x) => x !== a),
        }),
    });
  }
  for (const l of value.labels)
    pills.push({
      key: `l-${l}`,
      label: l,
      onRemove: () =>
        onChange({ ...value, labels: value.labels.filter((x) => x !== l) }),
    });
  if (value.dueAfter)
    pills.push({
      key: "da",
      label: `Due after ${value.dueAfter}`,
      onRemove: () => onChange({ ...value, dueAfter: null }),
    });
  if (value.dueBefore)
    pills.push({
      key: "db",
      label: `Due before ${value.dueBefore}`,
      onRemove: () => onChange({ ...value, dueBefore: null }),
    });

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <span
          key={p.key}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200"
        >
          {p.label}
          <button
            type="button"
            onClick={p.onRemove}
            className="hover:text-teal-900"
            aria-label={`Remove ${p.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
};
