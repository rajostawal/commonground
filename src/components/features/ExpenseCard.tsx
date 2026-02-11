"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/money/formatters";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/hooks/useToast";
import { Pencil, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Doc } from "@/../convex/_generated/dataModel";

interface ExpenseCardProps {
  expense: Doc<"expenses">;
  currentUserId: string;
  currency: string;
}

export function ExpenseCard({ expense, currentUserId, currency }: ExpenseCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteExpense = useMutation(api.expenses.deleteExpense);

  const myShare = expense.splits.find((s) => s.userId === currentUserId)?.amountCents ?? 0;
  const iPaid = expense.paidByUserId === currentUserId;
  const iOwe = !iPaid && myShare > 0;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExpense({ expenseId: expense._id });
      toast({
        title: "Expense deleted",
        variant: "default",
        actionLabel: "Undo",
        onAction: () => {
          // Undo is handled via activity log — toast is informational
          toast({ title: "Use Activity log to undo", variant: "info" });
        },
        duration: 6000,
      });
    } catch (err) {
      toast({ title: "Failed to delete", variant: "error" });
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  return (
    <>
      <div className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 hover:border-[var(--color-border-default)] transition-colors">
        {/* Amount indicator */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-medium font-mono",
            iPaid
              ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
              : iOwe
              ? "bg-[var(--color-error-bg)] text-[var(--color-error)]"
              : "bg-[var(--color-bg-surface-3)] text-[var(--color-text-muted)]"
          )}
        >
          {expense.currency}
        </div>

        {/* Description + meta */}
        <div className="flex-1 min-w-0">
          <Link href={`/expenses/${expense._id}`} className="hover:underline">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {expense.description}
            </p>
          </Link>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {formatDate(expense.createdAt)}
            {expense.lastEditedAt && (
              <span className="ml-1.5 text-[var(--color-text-disabled)]">(edited)</span>
            )}
          </p>
        </div>

        {/* Amount + status */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium font-mono text-[var(--color-text-primary)]">
            {formatCurrency(expense.amountCents, expense.currency)}
          </p>
          {iPaid ? (
            <p className="text-xs text-[var(--color-success)]">you paid</p>
          ) : iOwe ? (
            <p className="text-xs text-[var(--color-error)]">
              you owe {formatCurrency(myShare, expense.currency)}
            </p>
          ) : null}
        </div>

        {/* Actions (visible on hover on desktop) */}
        <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/expenses/${expense._id}`}>
            <Button variant="ghost" size="icon" aria-label="Edit expense">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete expense"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5 text-[var(--color-error)]" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete expense?"
        description={`"${expense.description}" (${formatCurrency(expense.amountCents, expense.currency)}) will be permanently deleted. This can be undone from the activity log.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
