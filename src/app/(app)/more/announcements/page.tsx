"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelative } from "@/lib/money/formatters";
import { Megaphone } from "lucide-react";

export default function AnnouncementsPage() {
  const household = useQuery(api.households.getMyHousehold);
  const announcements = useQuery(
    api.messages.listAnnouncements,
    household ? { householdId: household._id } : "skip"
  );
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );

  const memberMap = Object.fromEntries(
    (members ?? []).map((m) => [
      m.membership.userId,
      { name: m.user?.name ?? "Unknown", imageUrl: m.user?.imageUrl },
    ])
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Announcements</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {announcements === undefined ? (
          <SkeletonList count={3} />
        ) : announcements.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-8 w-8" />}
            title="No announcements"
            description="Announcements will appear here when posted from Chat."
          />
        ) : (
          announcements.map((msg) => {
            const author = memberMap[msg.authorUserId];
            return (
              <div key={msg._id} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <Avatar fallback={author?.name ?? "?"} src={author?.imageUrl} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{author?.name ?? "Unknown"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatRelative(msg.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
