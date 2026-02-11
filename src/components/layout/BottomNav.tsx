"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, DollarSign, CheckSquare, Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
      <div className="flex pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/home"
              ? pathname === "/home" || pathname === "/"
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
