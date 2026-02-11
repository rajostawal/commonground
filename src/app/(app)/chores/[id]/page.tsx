"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { type Id } from "@/../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/money/formatters";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ChoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const choreId = params.id as Id<"chores">;

  const data = useQuery(api.chores.getById, { choreId });
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const completeChore = useMutation(api.chores.completeChore);
  const deleteChore = useMutation(api.chores.deleteChore);

  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const memberNameMap = Object.fromEntries(
    (members ?? []).map((m) => [m.membership.userId, m.user?.name ?? "Unknown"])
  );

  if (data === undefined) {
    return <div className="p-4 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /></div>;
  }

  if (!data) return <div className="p-4 text-[var(--color-text-muted)]">Chore not found.</div>;

  const { chore, completions } = data;

  const currentAssignee =
    chore.rotationType === "fixed"
      ? chore.assignedMemberIds.map((id) => memberNameMap[id] ?? id).join(", ")
      : memberNameMap[chore.assignedMemberIds[chore.currentAssigneeIdx] ?? ""] ?? "Unassigned";

  async function handleComplete() {
    setCompleting(true);
    try {
      await completeChore({ choreId: chore._id });
      toast({ title: "Chore completed!", variant: "success" });
      setShowComplete(false);
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed", variant: "error" });
    } finally {
      setCompleting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteChore({ choreId: chore._id });
      toast({ title: "Chore deleted", variant: "default" });
      router.push("/chores");
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
          <Link href="/chores">
            <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Chore</h1>
        </div>
        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setShowDelete(true)}>
          <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-5">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{chore.title}</h2>
          {chore.description && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{chore.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{chore.frequency}</Badge>
          <Badge variant="accent">{chore.rotationType}</Badge>
        </div>

        <div className="rounded-lg bg-[var(--color-bg-surface-2)] p-4 space-y-2">
          <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Current assignee</p>
          <p className="text-base font-medium text-[var(--color-text-primary)]">{currentAssignee}</p>
        </div>

        {completions.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              Recent completions
            </h3>
            <div className="space-y-1.5">
              {completions.map((c) => (
                <div key={c._id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    {memberNameMap[c.completedByUserId] ?? "Unknown"}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{formatDate(c.completedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={() => setShowComplete(true)}>
          <Check className="h-4 w-4" />
          Mark complete
        </Button>
      </div>

      <Sheet open={showComplete} onOpenChange={setShowComplete}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Complete "{chore.title}"?</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              {chore.rotationType === "round-robin"
                ? `This will mark the chore as done and rotate to the next person.`
                : `This will mark the chore as done.`}
            </p>
            <Button variant="primary" size="lg" className="w-full" loading={completing} onClick={handleComplete}>
              Confirm completion
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete chore?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
