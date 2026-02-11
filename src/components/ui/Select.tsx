"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function Select({ value, onValueChange, options, placeholder, className, disabled }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          "flex w-full items-center justify-between rounded-md border",
          "bg-[var(--color-bg-surface-2)] px-3 py-2 text-sm",
          "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]",
          "text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-focus)] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder ?? "Select..."} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={cn(
            "relative z-50 min-w-[8rem] overflow-hidden rounded-md border",
            "bg-[var(--color-bg-surface-2)] border-[var(--color-border-default)] shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-3 py-2 text-sm",
                  "text-[var(--color-text-primary)] outline-none",
                  "focus:bg-[var(--color-accent-muted)] focus:text-[var(--color-accent)]",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                )}
              >
                <span className="absolute right-2">
                  <RadixSelect.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export { Select };
