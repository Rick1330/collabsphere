"use client";

import * as React from "react";

import { cn } from "../lib/utils";

type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
};

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, decorative = true, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      role={decorative ? "presentation" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-[var(--border-subtle)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  ),
);

Separator.displayName = "Separator";

export { Separator };
