"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { type Id } from "@/../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { ArrowLeft, Trash2, Check, X } from "lucide-react";
import Link from "next/link";

export default function RuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const ruleId = params.id as Id<"rules">;

  const rule = useQuery(api.rules.getById, { ruleId });
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const toggleAgree = useMutation(api.rules.toggleAgree);
  const deleteRule = useMutation(api.rules.deleteRule);

  const [toggling, setToggling] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (rule === undefined) return <div className="p-4"><Skeleton className="h-8 w-48" /></div>;
  if (!rule) return <div className="p-4 text-[var(--color-text-muted)]">Rule not found.</div>;

  const clerkId = user?.id ?? "";
  const iAgreed = rule.agreedByUserIds.includes(clerkId);
  const totalMembers = members?.length ?? 1;
  const pct = Math.round((rule.agreedByUserIds.length / totalMembers) * 100);
  const memberNameMap = Object.fromEntries((members ?? []).map((m) => [m.membership.userId, m.user?.name ?? "Unknown"]));

  async function handleToggle() {
    setToggling(true);
    try {
      await toggleAgree({ ruleId });
      toast({ title: iAgreed ? "Agreement removed" : "Rule agreed!", variant: iAgreed ? "default" : "success" });
    } catch (err) {
      toast({ title: "Failed", variant: "error" });
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRule({ ruleId });
      toast({ title: "Rule deleted", variant: "default" });
      router.push("/more/rules");
    } catch {
      toast({ title: "Failed to delete", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <Link href="/more/rules"><Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Rule</h1>
        </div>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{rule.title}</h2>
          {rule.description && <p className="text-sm text-[var(--color-text-secondary)] mt-2">{rule.description}</p>}
        </div>

        <div className="flex gap-2">
          <Badge variant="default" className="capitalize">{rule.category}</Badge>
          <Badge variant={rule.priority === "high" ? "error" : rule.priority === "medium" ? "warning" : "default"}>{rule.priority} priority</Badge>
        </div>

        {/* Agreement progress */}
        <div className="rounded-lg bg-[var(--color-bg-surface-2)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-secondary)]">Agreement</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{rule.agreedByUserIds.length}/{totalMembers} ({pct}%)</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-bg-surface-3)]">
            <div className="h-2 rounded-full bg-[var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(members ?? []).map((m) => {
              const agreed = rule.agreedByUserIds.includes(m.membership.userId);
              return (
                <span key={m.membership.userId} className={`text-xs px-2 py-0.5 rounded-full ${agreed ? "bg-[var(--color-success-bg)] text-[var(--color-success)]" : "bg-[var(--color-bg-surface-3)] text-[var(--color-text-muted)]"}`}>
                  {m.user?.name ?? "Unknown"} {agreed ? "✓" : ""}
                </span>
              );
            })}
          </div>
        </div>

        <Button
          variant={iAgreed ? "secondary" : "primary"}
          size="lg"
          className="w-full"
          loading={toggling}
          onClick={handleToggle}
        >
          {iAgreed ? <><X className="h-4 w-4" />Remove agreement</> : <><Check className="h-4 w-4" />I agree to this rule</>}
        </Button>
      </div>

      <ConfirmDialog open={showDelete} onOpenChange={setShowDelete} title="Delete rule?" confirmLabel="Delete" destructive loading={deleting} onConfirm={handleDelete} />
    </div>
  );
}
