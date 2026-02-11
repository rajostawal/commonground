"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Plus, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANTS = {
  high: "error" as const,
  medium: "warning" as const,
  low: "default" as const,
};

export default function RulesPage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const rules = useQuery(
    api.rules.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );

  const totalMembers = members?.length ?? 1;
  const clerkId = user?.id ?? "";

  // Group rules by category
  const grouped = (rules ?? []).reduce<Record<string, typeof rules>>((acc, rule) => {
    if (!rule) return acc;
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category]!.push(rule);
    return acc;
  }, {} as Record<string, typeof rules>);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Rules</h1>
        <Link href="/more/rules/add">
          <Button variant="primary" size="sm"><Plus className="h-4 w-4" />Add</Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {rules === undefined ? (
          <SkeletonList count={3} />
        ) : rules.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-8 w-8" />}
            title="No rules yet"
            description="Add household rules that everyone should agree to."
            action={
              <Link href="/more/rules/add">
                <Button variant="primary" size="md"><Plus className="h-4 w-4" />Add rule</Button>
              </Link>
            }
          />
        ) : (
          Object.entries(grouped).map(([category, categoryRules]) => (
            <div key={category}>
              <h2 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2 capitalize">
                {category}
              </h2>
              <div className="space-y-2">
                {(categoryRules ?? []).filter(Boolean).map((rule) => {
                  if (!rule) return null;
                  const agreedCount = rule.agreedByUserIds.length;
                  const pct = Math.round((agreedCount / totalMembers) * 100);
                  const iAgreed = rule.agreedByUserIds.includes(clerkId);

                  return (
                    <Link key={rule._id} href={`/more/rules/${rule._id}`}>
                      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 hover:border-[var(--color-border-default)] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{rule.title}</p>
                            {rule.description && (
                              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{rule.description}</p>
                            )}
                          </div>
                          <Badge variant={PRIORITY_VARIANTS[rule.priority]}>{rule.priority}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1 rounded-full bg-[var(--color-bg-surface-3)]">
                            <div
                              className="h-1 rounded-full bg-[var(--color-accent)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)]">{agreedCount}/{totalMembers} agreed</span>
                          {iAgreed && <Badge variant="success" className="text-[10px] py-0">You agreed</Badge>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
