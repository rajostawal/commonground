"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import Link from "next/link";
import { Plus, FileText, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/money/formatters";
import { toast } from "@/hooks/useToast";
import { useState } from "react";
import type { Id } from "@/../convex/_generated/dataModel";

const TYPE_LABELS: Record<string, string> = {
  rent: "Rent",
  electricity: "Electricity",
  water: "Water",
  internet: "Internet",
  insurance: "Insurance",
  streaming: "Streaming",
  other: "Other",
};

export default function ContractsPage() {
  const household = useQuery(api.households.getMyHousehold);
  const contracts = useQuery(
    api.contracts.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const deleteContract = useMutation(api.contracts.deleteContract);

  const [deleteId, setDeleteId] = useState<Id<"contracts"> | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteContract({ contractId: deleteId });
      toast({ title: "Contract deleted", variant: "default" });
    } catch {
      toast({ title: "Failed to delete", variant: "error" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <Link href="/finances">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Contracts</h1>
        </div>
        <Link href="/finances/contracts/add">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {contracts === undefined ? (
          <SkeletonList count={3} />
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No contracts yet"
            description="Track your household's recurring bills like rent, utilities, and subscriptions."
            action={
              <Link href="/finances/contracts/add">
                <Button variant="primary" size="md">
                  <Plus className="h-4 w-4" />
                  Add contract
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {contracts.map((contract) => (
              <div
                key={contract._id}
                className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {contract.name}
                    </p>
                    <Badge variant="default">{TYPE_LABELS[contract.type] ?? contract.type}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {contract.frequency}
                    {contract.dueDay && ` · Due on the ${contract.dueDay}${contract.dueDay === 1 ? "st" : contract.dueDay === 2 ? "nd" : contract.dueDay === 3 ? "rd" : "th"}`}
                  </p>
                </div>
                <span className="font-mono text-sm text-[var(--color-text-primary)]">
                  {formatCurrency(contract.amountCents, contract.currency)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete contract"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteId(contract._id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--color-error)]" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete contract?"
        description="This will remove the contract tracking record."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
