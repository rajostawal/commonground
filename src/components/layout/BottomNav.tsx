"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, ShoppingCart, CheckSquare, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/bulletin-board", label: "Board", icon: ClipboardList },
  { href: "/shopping-list", label: "Shopping", icon: ShoppingCart },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/finances", label: "Finances", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
      <div className="flex pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/bulletin-board"
              ? pathname === "/bulletin-board" || pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-focus)] focus-visible:ring-inset",
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
