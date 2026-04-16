import { useId } from "react";

import { cn } from "@collabsphere/ui/lib/utils";

type KeyboardHintProps = {
  keys: readonly string[];
  label: string;
  className?: string;
};

export function KeyboardHint({ className, keys, label }: Readonly<KeyboardHintProps>) {
  const labelId = useId();

  return (
    <div className={cn("flex items-center gap-2", className)} role="group" aria-labelledby={labelId}>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <kbd
            key={`${key}-${index}`}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-stone-200 border-b-2 border-b-stone-300 bg-white px-1.5 font-mono text-[10px] text-stone-500 shadow-sm"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span id={labelId} className="text-[11px] text-stone-400">
        {label}
      </span>
    </div>
  );
}
