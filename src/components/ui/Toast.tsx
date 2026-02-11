"use client";

import * as RadixToast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-center justify-between gap-3",
    "overflow-hidden rounded-lg border p-4 shadow-lg",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
    "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "transition-all",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-primary)]",
        success:
          "bg-[var(--color-success-bg)] border-[var(--color-success)]/40 text-[var(--color-success)]",
        error:
          "bg-[var(--color-error-bg)] border-[var(--color-error)]/40 text-[var(--color-error)]",
        warning:
          "bg-[var(--color-warning-bg)] border-[var(--color-warning)]/40 text-[var(--color-warning)]",
        info:
          "bg-[var(--color-info-bg)] border-[var(--color-info)]/40 text-[var(--color-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps
  extends RadixToast.ToastProps,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

function Toast({ className, variant, title, description, action, ...props }: ToastProps) {
  return (
    <RadixToast.Root
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {title && (
          <RadixToast.Title className="text-sm font-medium">{title}</RadixToast.Title>
        )}
        {description && (
          <RadixToast.Description className="text-xs opacity-80">{description}</RadixToast.Description>
        )}
      </div>
      {action}
      <RadixToast.Close className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)]">
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Close</span>
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

export { Toast, toastVariants };
