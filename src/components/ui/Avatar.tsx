import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const initials = fallback
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <RadixAvatar.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt={alt ?? fallback}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <RadixAvatar.Fallback
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full",
          "bg-[var(--color-bg-surface-3)] text-[var(--color-text-secondary)] font-medium"
        )}
      >
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

export { Avatar };
