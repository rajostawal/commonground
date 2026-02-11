"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

const Dialog = RadixDialog.Root;
const DialogTrigger = RadixDialog.Trigger;
const DialogClose = RadixDialog.Close;

function DialogPortal({ children }: { children: ReactNode }) {
  return <RadixDialog.Portal>{children}</RadixDialog.Portal>;
}

function DialogOverlay({ className, ...props }: RadixDialog.DialogOverlayProps) {
  return (
    <RadixDialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: RadixDialog.DialogContentProps & { showClose?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
          "w-full max-w-md",
          "rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-3)] p-6 shadow-2xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <RadixDialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-[var(--color-bg-base)] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)] focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="sr-only">Close</span>
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 pb-4", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: RadixDialog.DialogTitleProps) {
  return (
    <RadixDialog.Title
      className={cn("text-base font-semibold text-[var(--color-text-primary)]", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: RadixDialog.DialogDescriptionProps) {
  return (
    <RadixDialog.Description
      className={cn("text-sm text-[var(--color-text-muted)]", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
};
