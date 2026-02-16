"use client";

import Link from "next/link";
import {
  Home,
  User,
  Bell,
  Crown,
  Activity,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

const settingsItems = [
  {
    href: "/settings/household",
    label: "Household",
    description: "Name, members, invite code, currency",
    icon: Home,
  },
  {
    href: "/settings/profile",
    label: "Profile",
    description: "Name, email, sign out",
    icon: User,
  },
  {
    href: "/settings/general",
    label: "General",
    description: "Notifications, language",
    icon: Bell,
  },
  {
    href: "/settings/premium",
    label: "Premium",
    description: "Upgrade and manage subscription",
    icon: Crown,
  },
  {
    href: "/settings/activity-log",
    label: "Activity Log",
    description: "View household action history",
    icon: Activity,
  },
  {
    href: "/settings/support",
    label: "Support & Legal",
    description: "FAQs, feedback, legal, delete account",
    icon: HelpCircle,
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {settingsItems.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 hover:border-[var(--color-border-default)] transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-surface-2)]">
                <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
