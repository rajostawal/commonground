"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { type Id } from "@/../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { SplitEditor } from "@/components/features/SplitEditor";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { formatCurrency, formatDate, parseToCents, COMMON_CURRENCIES } from "@/lib/money/formatters";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const expenseId = params.id as Id<"expenses">;

  const expense = useQuery(api.expenses.getById, { expenseId });
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const updateExpense = useMutation(api.expenses.updateExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);

  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paidByUserId, setPaidByUserId] = useState("");
  const [splits, setSplits] = useState<{ userId: string; amountCents: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function startEdit() {
    if (!expense) return;
    setDescription(expense.description);
    setAmountStr((expense.amountCents / 100).toFixed(2));
    setCurrency(expense.currency);
    setPaidByUserId(expense.paidByUserId);
    setSplits(expense.splits);
    setEditing(true);
  }

  async function handleSave() {
    if (!expense) return;
    const amountCents = parseToCents(amountStr) ?? expense.amountCents;
    setSaving(true);
    try {
      await updateExpense({
        expenseId: expense._id,
        description: description.trim(),
        amountCents,
        currency,
        paidByUserId,
        splits,
      });
      toast({ title: "Expense updated", variant: "success" });
      setEditing(false);
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed to save", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;
    setDeleting(true);
    try {
      await deleteExpense({ expenseId: expense._id });
      toast({ title: "Expense deleted", variant: "default" });
      router.push("/finances");
    } catch {
      toast({ title: "Failed to delete", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  if (expense === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (expense === null) {
    return (
      <div className="p-4">
        <p className="text-[var(--color-text-muted)]">Expense not found.</p>
      </div>
    );
  }

  const memberList = (members ?? []).map((m) => ({
    userId: m.membership.userId,
    name: m.user?.name ?? "Unknown",
  }));

  const memberNameMap = Object.fromEntries(memberList.map((m) => [m.userId, m.name]));
  const amountCents = parseToCents(amountStr) ?? expense.amountCents;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <Link href="/finances">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {editing ? "Edit Expense" : "Expense"}
          </h1>
        </div>
        {!editing && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label="Edit" onClick={startEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="h-4 w-4 text-[var(--color-error)]" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {editing ? (
          <div className="space-y-5">
            <FormField label="Description" required>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
            </FormField>
            <div className="flex gap-3">
              <FormField label="Amount" required className="flex-1">
                <Input
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="font-mono"
                />
              </FormField>
              <FormField label="Currency" className="w-28">
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  options={COMMON_CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
                />
              </FormField>
            </div>
            <FormField label="Paid by">
              <Select
                value={paidByUserId}
                onValueChange={setPaidByUserId}
                options={memberList.map((m) => ({ value: m.userId, label: m.name }))}
              />
            </FormField>
            {amountCents > 0 && (
              <FormField label="Split">
                <SplitEditor
                  totalCents={amountCents}
                  currency={currency}
                  members={memberList}
                  onChange={setSplits}
                />
              </FormField>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={saving}
                disabled={!description.trim() || amountCents <= 0}
                onClick={handleSave}
              >
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                {expense.description}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {formatDate(expense.createdAt)}
                {expense.lastEditedAt && ` · Edited ${formatDate(expense.lastEditedAt)}`}
              </p>
            </div>

            <div className="rounded-lg bg-[var(--color-bg-surface-2)] p-4">
              <p className="text-3xl font-bold font-mono text-[var(--color-text-primary)]">
                {formatCurrency(expense.amountCents, expense.currency)}
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Paid by{" "}
                <span className="text-[var(--color-text-secondary)] font-medium">
                  {memberNameMap[expense.paidByUserId] ?? expense.paidByUserId}
                </span>
              </p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Split ({expense.splitType})
              </h3>
              <div className="space-y-1.5">
                {expense.splits.map((split) => (
                  <div key={split.userId} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">
                      {memberNameMap[split.userId] ?? split.userId}
                      {split.userId === user?.id && (
                        <span className="ml-1.5 text-[var(--color-text-muted)]">(you)</span>
                      )}
                    </span>
                    <span className="font-mono text-[var(--color-text-primary)]">
                      {formatCurrency(split.amountCents, expense.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {expense.notes && (
              <div>
                <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                  Notes
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{expense.notes}</p>
              </div>
            )}

            {expense.lastEditedByUserId && (
              <p className="text-xs text-[var(--color-text-muted)]">
                Last edited by {memberNameMap[expense.lastEditedByUserId] ?? "Unknown"}
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete expense?"
        description={`This will permanently delete "${expense.description}". You can undo this from the activity log.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
