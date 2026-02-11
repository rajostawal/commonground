"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/hooks/useToast";
import { formatRelative } from "@/lib/money/formatters";
import {
  Activity,
  RotateCcw,
  DollarSign,
  Handshake,
  Settings,
  UserPlus,
  UserMinus,
  CheckSquare,
  ScrollText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ACTION_META: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  expense_create: { label: "Added expense", icon: DollarSign, color: "var(--color-success)" },
  expense_edit: { label: "Edited expense", icon: DollarSign, color: "var(--color-accent)" },
  expense_delete: { label: "Deleted expense", icon: DollarSign, color: "var(--color-error)" },
  settlement_create: { label: "Recorded settlement", icon: Handshake, color: "var(--color-success)" },
  settlement_delete: { label: "Deleted settlement", icon: Handshake, color: "var(--color-error)" },
  household_settings_change: { label: "Changed settings", icon: Settings, color: "var(--color-text-muted)" },
  member_join: { label: "Joined household", icon: UserPlus, color: "var(--color-success)" },
  member_leave: { label: "Left household", icon: UserMinus, color: "var(--color-error)" },
  chore_complete: { label: "Completed chore", icon: CheckSquare, color: "var(--color-success)" },
  rule_agree: { label: "Agreed to rule", icon: ScrollText, color: "var(--color-accent)" },
};

export default function ActivityPage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const activityLog = useQuery(
    api.activityLog.listByHousehold,
    household ? { householdId: household._id, limit: 100 } : "skip"
  );
  const undoableActions = useQuery(
    api.activityLog.getUndoableActions,
    household ? { householdId: household._id } : "skip"
  );
  const undoAction = useMutation(api.activityLog.undoAction);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );

  const [undoingId, setUndoingId] = useState<string | null>(null);

  const undoableIds = new Set(undoableActions?.map((a) => a._id) ?? []);

  const memberMap = new Map(
    members?.map(({ membership, user: u }) => [membership.userId, u?.name ?? "Unknown"]) ?? []
  );

  async function handleUndo(logId: string) {
    setUndoingId(logId);
    try {
      await undoAction({ logId: logId as never });
      toast({ title: "Action undone", variant: "success" });
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed to undo", variant: "error" });
    } finally {
      setUndoingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/home">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Activity</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activityLog === undefined ? (
          <SkeletonList count={6} />
        ) : activityLog.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="No activity yet"
            description="Actions like adding expenses, completing chores, and settlements will appear here."
          />
        ) : (
          <div className="space-y-1">
            {activityLog.map((entry) => {
              const meta = ACTION_META[entry.type] ?? {
                label: entry.type,
                icon: Activity,
                color: "var(--color-text-muted)",
              };
              const Icon = meta.icon;
              const isMe = entry.actorUserId === user?.id;
              const actorName = isMe ? "You" : (memberMap.get(entry.actorUserId) ?? "Someone");
              const canUndo = undoableIds.has(entry._id) && !entry.undoneAt;

              return (
                <div
                  key={entry._id}
                  className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                    entry.undoneAt ? "opacity-50" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `color-mix(in srgb, ${meta.color} 15%, transparent)` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">{actorName}</span>{" "}
                      <span className="text-[var(--color-text-secondary)]">
                        {meta.label.toLowerCase()}
                      </span>
                      {entry.targetDescription && (
                        <span className="text-[var(--color-text-secondary)]">
                          {" — "}{entry.targetDescription}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatRelative(entry.createdAt)}
                    </p>
                    {entry.undoneAt && (
                      <Badge variant="default" className="mt-1 text-[10px]">Undone</Badge>
                    )}
                  </div>

                  {/* Undo button */}
                  {canUndo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs gap-1 text-[var(--color-accent)]"
                      onClick={() => handleUndo(entry._id)}
                      disabled={undoingId === entry._id}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Undo
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
