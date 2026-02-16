"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { toast } from "@/hooks/useToast";
import { formatCurrency, formatDate, parseToCents, COMMON_CURRENCIES } from "@/lib/money/formatters";
import { computeBalances } from "@/lib/money/balanceCalculator";
import { simplifyDebts } from "@/lib/money/debtSimplifier";
import { ArrowLeft, Plus, ArrowRight, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SettlementsPage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const expenses = useQuery(
    api.expenses.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const settlements = useQuery(
    api.settlements.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const createSettlement = useMutation(api.settlements.createSettlement);
  const deleteSettlement = useMutation(api.settlements.deleteSettlement);

  const [showForm, setShowForm] = useState(false);
  const [fromUserId, setFromUserId] = useState(user?.id ?? "");
  const [toUserId, setToUserId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState(household?.defaultCurrency ?? "USD");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const memberList = (members ?? []).map((m) => ({
    userId: m.membership.userId,
    name: m.user?.name ?? "Unknown",
  }));
  const memberNameMap = Object.fromEntries(memberList.map((m) => [m.userId, m.name]));

  const balanceData =
    expenses && settlements
      ? computeBalances(
          expenses.map((e) => ({
            paidByUserId: e.paidByUserId,
            amountCents: e.amountCents,
            currency: e.currency,
            splits: e.splits,
          })),
          settlements.map((s) => ({
            fromUserId: s.fromUserId,
            toUserId: s.toUserId,
            amountCents: s.amountCents,
            currency: s.currency,
          }))
        )
      : null;

  const suggestions = balanceData
    ? (() => {
        const record: Record<string, number> = {};
        const balances = balanceData.get(household?.defaultCurrency ?? "USD");
        if (balances) {
          for (const [uid, amt] of balances) {
            if (amt !== 0) record[uid] = amt;
          }
        }
        return simplifyDebts(record, household?.defaultCurrency ?? "USD");
      })()
    : [];

  async function handleRecord() {
    if (!household) return;
    const amountCents = parseToCents(amountStr);
    if (!amountCents || amountCents <= 0 || !fromUserId || !toUserId) return;

    setSaving(true);
    try {
      await createSettlement({
        householdId: household._id,
        fromUserId,
        toUserId,
        amountCents,
        currency,
      });
      toast({ title: "Settlement recorded!", variant: "success" });
      setShowForm(false);
      setAmountStr("");
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed to record", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSettlement({ settlementId: deleteId as Parameters<typeof deleteSettlement>[0]["settlementId"] });
      toast({ title: "Settlement deleted", variant: "default" });
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
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Settlements</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Record
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {suggestions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Suggested Settlements</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md bg-[var(--color-bg-surface-2)] px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {memberNameMap[s.fromUserId] ?? "Unknown"}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {memberNameMap[s.toUserId] ?? "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[var(--color-text-primary)]">
                        {formatCurrency(s.amountCents, s.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setFromUserId(s.fromUserId);
                          setToUserId(s.toUserId);
                          setAmountStr((s.amountCents / 100).toFixed(2));
                          setCurrency(s.currency);
                          setShowForm(true);
                        }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Record
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            History
          </h2>
          {settlements === undefined ? (
            <SkeletonList count={3} />
          ) : settlements.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-8 w-8" />}
              title="No settlements recorded"
              description="Record a settlement when someone pays another housemate back."
            />
          ) : (
            <div className="space-y-2">
              {settlements.map((s) => (
                <div
                  key={s._id}
                  className="group flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">{memberNameMap[s.fromUserId] ?? "Unknown"}</span>
                      {" paid "}
                      <span className="font-medium">{memberNameMap[s.toUserId] ?? "Unknown"}</span>
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatDate(s.createdAt)}</p>
                  </div>
                  <span className="font-mono text-sm text-[var(--color-success)]">
                    {formatCurrency(s.amountCents, s.currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete settlement"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(s._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-error)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Record Settlement</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <FormField label="From (who paid)">
              <Select
                value={fromUserId}
                onValueChange={setFromUserId}
                options={memberList.map((m) => ({ value: m.userId, label: m.name }))}
              />
            </FormField>
            <FormField label="To (who received)">
              <Select
                value={toUserId}
                onValueChange={setToUserId}
                options={memberList
                  .filter((m) => m.userId !== fromUserId)
                  .map((m) => ({ value: m.userId, label: m.name }))}
                placeholder="Select recipient..."
              />
            </FormField>
            <div className="flex gap-3">
              <FormField label="Amount" className="flex-1">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
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
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={saving}
              disabled={!fromUserId || !toUserId || !parseToCents(amountStr)}
              onClick={handleRecord}
            >
              Record settlement
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete settlement?"
        description="This will remove the settlement record. The activity log tracks this change."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
