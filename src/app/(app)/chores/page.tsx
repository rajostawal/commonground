"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function ChoresPage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const chores = useQuery(
    api.chores.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );

  const [filter, setFilter] = useState<"all" | "mine">("all");
  const clerkId = user?.id ?? "";

  const memberNameMap = Object.fromEntries(
    (members ?? []).map((m) => [m.membership.userId, m.user?.name ?? "Unknown"])
  );

  const filtered = (chores ?? []).filter((c) => {
    if (filter === "mine") {
      if (c.rotationType === "fixed") return c.assignedMemberIds.includes(clerkId);
      return c.assignedMemberIds[c.currentAssigneeIdx] === clerkId;
    }
    return true;
  });

  function getCurrentAssignee(chore: typeof chores extends (infer T)[] | undefined ? T : never) {
    if (!chore) return "";
    if (chore.rotationType === "fixed") {
      return chore.assignedMemberIds.map((id) => memberNameMap[id] ?? id).join(", ");
    }
    const id = chore.assignedMemberIds[chore.currentAssigneeIdx];
    return id ? (memberNameMap[id] ?? id) : "Unassigned";
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Chores</h1>
        <Link href="/chores/add">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {(["all", "mine"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            {f === "all" ? "All chores" : "Mine"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {chores === undefined ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title={filter === "mine" ? "No chores assigned to you" : "No chores yet"}
            description={filter === "mine" ? "Switch to 'All' to see household chores." : "Add your first chore to get started."}
            action={
              filter === "all" ? (
                <Link href="/chores/add">
                  <Button variant="primary" size="md">
                    <Plus className="h-4 w-4" /> Add chore
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          filtered.map((chore) => (
            <Link key={chore._id} href={`/chores/${chore._id}`}>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 hover:border-[var(--color-border-default)] transition-colors">
                <div className="h-9 w-9 rounded-full bg-[var(--color-bg-surface-2)] flex items-center justify-center shrink-0">
                  <CheckSquare className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{chore.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {getCurrentAssignee(chore)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="default">{chore.frequency}</Badge>
                  <span className="text-xs text-[var(--color-text-muted)]">{chore.rotationType}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
