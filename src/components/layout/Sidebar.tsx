"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ShoppingCart,
  CheckSquare,
  Wallet,
  Settings,
  Home as HomeIcon,
  User,
  Bell,
  Crown,
  Activity,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainNav = [
  { href: "/bulletin-board", label: "Bulletin Board", icon: ClipboardList },
  { href: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/finances", label: "Finances", icon: Wallet },
];

const settingsNav = [
  { href: "/settings/household", label: "Household", icon: HomeIcon },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/general", label: "General", icon: Bell },
  { href: "/settings/premium", label: "Premium", icon: Crown },
  { href: "/settings/activity-log", label: "Activity Log", icon: Activity },
  { href: "/settings/support", label: "Support & Legal", icon: HelpCircle },
];

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  indent = false,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-focus)]",
        indent && "pl-7",
        isActive
          ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [settingsExpanded, setSettingsExpanded] = useState(
    pathname.startsWith("/settings")
  );

  function isActive(href: string) {
    if (href === "/bulletin-board") return pathname === "/bulletin-board" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--color-border-subtle)]">
        <div className="h-7 w-7 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
          <ClipboardList className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">CommonGround</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {mainNav.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={isActive(href)}
          />
        ))}

        {/* Separator */}
        <div className="my-2 border-t border-[var(--color-border-subtle)]" />

        {/* Settings group */}
        <button
          onClick={() => setSettingsExpanded(!settingsExpanded)}
          className={cn(
            "flex items-center justify-between w-full rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-focus)]"
          )}
        >
          <span className="flex items-center gap-2.5">
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              settingsExpanded && "rotate-180"
            )}
          />
        </button>

        {settingsExpanded &&
          settingsNav.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={isActive(href)}
              indent
            />
          ))}
      </nav>
    </aside>
  );
}
