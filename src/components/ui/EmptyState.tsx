import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 px-8 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-[var(--color-text-muted)] mb-1">{icon}</div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] max-w-xs">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
