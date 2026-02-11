import { type HTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

function FormField({ label, error, required, hint, className, children, ...props }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <label className="text-sm font-medium text-[var(--color-text-secondary)]">
        {label}
        {required && <span className="ml-1 text-[var(--color-error)]">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--color-error)]" role="alert">{error}</p>
      )}
    </div>
  );
}

const inputClasses = cn(
  "w-full rounded-md border bg-[var(--color-bg-surface-2)] px-3 py-2",
  "text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
  "border-[var(--color-border-default)]",
  "hover:border-[var(--color-border-strong)]",
  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)] focus:border-transparent",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "transition-colors"
);

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClasses, className)} {...props} />
  )
);
Input.displayName = "Input";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputClasses, "min-h-[80px] resize-y", className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { FormField, Input, Textarea, inputClasses };
