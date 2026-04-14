"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-accent-hover)]",
        secondary:
          "border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--color-text-primary)] hover:bg-[var(--surface-card-subtle)]",
        ghost:
          "bg-transparent text-[var(--color-text-primary)] hover:bg-[color:color-mix(in_srgb,var(--surface-card)_82%,transparent)]",
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-9 rounded-[0.7rem] px-3 py-1.5 text-sm",
        lg: "min-h-12 px-5 py-3 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, type = "button", variant, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };
