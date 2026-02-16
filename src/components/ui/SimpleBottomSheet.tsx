"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
  /** Optional className for the content panel */
  className?: string;
}

/**
 * A minimal bottom sheet that does not use Radix Dialog.
 * Use this when Radix Dialog causes "Maximum update depth exceeded" with React 19.
 */
export function SimpleBottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: SimpleBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "simple-sheet-title" : undefined}
      aria-describedby={description ? "simple-sheet-desc" : undefined}
    >
      {/* Overlay */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="fixed inset-0 z-50 bg-black/60 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface-2)] shadow-2xl pb-safe animate-in slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:fade-out-0",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 mb-4 h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />
        {title != null && (
          <h2 id="simple-sheet-title" className="sr-only">
            {title}
          </h2>
        )}
        {description != null && (
          <p id="simple-sheet-desc" className="sr-only">
            {description}
          </p>
        )}
        <div className="pt-10">{children}</div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)]"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-[var(--color-text-muted)]" />
        </button>
      </div>
    </div>,
    document.body
  );
}
