"use client";

import Link from "next/link";
import { MessageSquare, Megaphone, ScrollText, Users, Settings, User, Activity, ChevronRight } from "lucide-react";

const moreItems = [
  { href: "/more/chat", label: "Chat", description: "Household messages", icon: MessageSquare },
  { href: "/more/announcements", label: "Announcements", description: "Important notices", icon: Megaphone },
  { href: "/more/rules", label: "Rules", description: "Household agreements", icon: ScrollText },
  { href: "/activity", label: "Activity Log", description: "Timeline & undo actions", icon: Activity },
  { href: "/more/members", label: "Members", description: "Housemates & invite code", icon: Users },
  { href: "/more/settings", label: "Settings", description: "Currency, AI, preferences", icon: Settings },
  { href: "/more/profile", label: "Profile", description: "Your account", icon: User },
];

export default function MorePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">More</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {moreItems.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-[var(--color-bg-surface-2)] transition-colors">
                <div className="h-9 w-9 rounded-lg bg-[var(--color-bg-surface-2)] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
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
    </div>
  );
}
