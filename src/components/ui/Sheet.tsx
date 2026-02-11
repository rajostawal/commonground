"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

const Sheet = RadixDialog.Root;
const SheetTrigger = RadixDialog.Trigger;
const SheetClose = RadixDialog.Close;

function SheetOverlay({ className, ...props }: RadixDialog.DialogOverlayProps) {
  return (
    <RadixDialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/60",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "bottom",
  ...props
}: RadixDialog.DialogContentProps & { side?: "bottom" | "right" }) {
  return (
    <RadixDialog.Portal>
      <SheetOverlay />
      <RadixDialog.Content
        className={cn(
          "fixed z-50",
          "border-[var(--color-border-default)] bg-[var(--color-bg-surface-2)] shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "bottom" && [
            "inset-x-0 bottom-0 rounded-t-2xl border-t pb-safe",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "max-h-[90dvh] overflow-y-auto",
          ],
          side === "right" && [
            "inset-y-0 right-0 h-full w-80 border-l",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          ],
          className
        )}
        {...props}
      >
        {side === "bottom" && (
          <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />
        )}
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)]">
          <X className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 px-4 pb-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: RadixDialog.DialogTitleProps) {
  return (
    <RadixDialog.Title
      className={cn("text-base font-semibold text-[var(--color-text-primary)]", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: RadixDialog.DialogDescriptionProps) {
  return (
    <RadixDialog.Description
      className={cn("text-sm text-[var(--color-text-muted)]", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
