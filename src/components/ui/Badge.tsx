import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-surface-3)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]",
        accent:
          "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/20",
        success:
          "bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/30",
        warning:
          "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        error:
          "bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]/30",
        info:
          "bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
