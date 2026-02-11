"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "as-needed", label: "As needed" },
];

export default function AddChorePage() {
  const router = useRouter();
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const createChore = useMutation(api.chores.createChore);

  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "as-needed">("weekly");
  const [rotationType, setRotationType] = useState<"fixed" | "round-robin">("round-robin");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const memberList = (members ?? []).map((m) => ({
    userId: m.membership.userId,
    name: m.user?.name ?? "Unknown",
  }));

  const isValid = title.trim().length >= 1 && selectedIds.size > 0;

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !household) return;

    setLoading(true);
    try {
      await createChore({
        householdId: household._id,
        title: title.trim(),
        frequency,
        rotationType,
        assignedMemberIds: [...selectedIds],
      });
      toast({ title: "Chore created!", variant: "success" });
      router.push("/chores");
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed to create", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/chores">
          <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Add Chore</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">
          <FormField label="Chore name" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Take out trash" autoFocus />
          </FormField>

          <FormField label="Frequency">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)} options={FREQUENCIES} />
          </FormField>

          <FormField label="Rotation">
            <div className="flex gap-2">
              {(["fixed", "round-robin"] as const).map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setRotationType(rt)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    rotationType === rt
                      ? "bg-[var(--color-accent-muted)] border-[var(--color-accent)]/30 text-[var(--color-accent)]"
                      : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                  )}
                >
                  {rt === "fixed" ? "Fixed" : "Round-robin"}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {rotationType === "fixed"
                ? "Always assigned to the same people."
                : "Rotates to the next person each time it's completed."}
            </p>
          </FormField>

          <FormField label="Assigned to" required>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {memberList.map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => toggleMember(m.userId)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                    selectedIds.has(m.userId)
                      ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]/30"
                      : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border-subtle)]"
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        <div className="sticky bottom-0 px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
          <Button type="submit" variant="primary" size="lg" loading={loading} disabled={!isValid} className="w-full">
            Create chore
          </Button>
        </div>
      </form>
    </div>
  );
}
