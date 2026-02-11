"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  DollarSign,
  CheckSquare,
  Calendar,
  MessageSquare,
  Megaphone,
  ScrollText,
  Users,
  Settings,
  User,
  Activity,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

const moreNav = [
  { href: "/more/chat", label: "Chat", icon: MessageSquare },
  { href: "/more/announcements", label: "Announcements", icon: Megaphone },
  { href: "/more/rules", label: "Rules", icon: ScrollText },
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/more/members", label: "Members", icon: Users },
  { href: "/more/settings", label: "Settings", icon: Settings },
  { href: "/more/profile", label: "Profile", icon: User },
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
  const [moreExpanded, setMoreExpanded] = useState(true);

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--color-border-subtle)]">
        <div className="h-7 w-7 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
          <Home className="h-4 w-4 text-white" />
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

        {/* More group */}
        <button
          onClick={() => setMoreExpanded(!moreExpanded)}
          className={cn(
            "flex items-center justify-between w-full rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
            "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-focus)]"
          )}
        >
          <span>More</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              moreExpanded && "rotate-180"
            )}
          />
        </button>

        {moreExpanded &&
          moreNav.map(({ href, label, icon }) => (
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
