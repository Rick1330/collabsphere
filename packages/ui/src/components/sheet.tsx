"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { cn } from "../lib/utils";

const sheetContentVariants = cva(
  "fixed z-50 flex flex-col border border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--color-text-primary)] shadow-[var(--shadow-elevated)] outline-none",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 rounded-b-[1.25rem] border-x-0 border-t-0",
        bottom: "inset-x-0 bottom-0 rounded-t-[1.25rem] border-x-0 border-b-0",
        left: "inset-y-0 left-0 h-full w-full max-w-md rounded-r-[1.25rem] border-y-0 border-l-0",
        right: "inset-y-0 right-0 h-full w-full max-w-md rounded-l-[1.25rem] border-y-0 border-r-0",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogContent> &
  VariantProps<typeof sheetContentVariants>;

const Sheet = Dialog;
const SheetTrigger = DialogTrigger;
const SheetClose = DialogClose;
const SheetPortal = DialogPortal;
const SheetTitle = DialogTitle;
const SheetDescription = DialogDescription;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogOverlay>,
  React.ComponentPropsWithoutRef<typeof DialogOverlay>
>(({ className, ...props }, ref) => (
  <DialogOverlay ref={ref} className={cn("bg-foreground/45", className)} {...props} />
));

SheetOverlay.displayName = "SheetOverlay";

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  SheetContentProps
>(({ className, side, ...props }, ref) => (
  <DialogPortal>
    <SheetOverlay />
    <DialogContent
      ref={ref}
      className={cn(sheetContentVariants({ side }), className)}
      {...props}
    />
  </DialogPortal>
));

SheetContent.displayName = "SheetContent";

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
