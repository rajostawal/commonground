"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { SplitEditor } from "@/components/features/SplitEditor";
import { toast } from "@/hooks/useToast";
import { parseToCents, COMMON_CURRENCIES } from "@/lib/money/formatters";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddExpensePage() {
  const router = useRouter();
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const createExpense = useMutation(api.expenses.createExpense);

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState(household?.defaultCurrency ?? "USD");
  const [paidByUserId, setPaidByUserId] = useState(user?.id ?? "");
  const [splits, setSplits] = useState<{ userId: string; amountCents: number; percentage?: number; shares?: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const amountCents = parseToCents(amountStr) ?? 0;

  // Sync currency with household default
  useEffect(() => {
    if (household?.defaultCurrency && !amountStr) {
      setCurrency(household.defaultCurrency);
    }
  }, [household?.defaultCurrency]);

  // Sync paidBy with current user
  useEffect(() => {
    if (user?.id) setPaidByUserId(user.id);
  }, [user?.id]);

  const memberList = (members ?? []).map((m) => ({
    userId: m.membership.userId,
    name: m.user?.name ?? "Unknown",
  }));

  const isValid =
    description.trim().length >= 1 &&
    amountCents > 0 &&
    splits.length > 0 &&
    splits.reduce((s, sp) => s + sp.amountCents, 0) === amountCents;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !household) return;

    setLoading(true);
    try {
      await createExpense({
        householdId: household._id,
        description: description.trim(),
        amountCents,
        currency,
        paidByUserId,
        splitType: "equal",
        splits,
      });
      toast({ title: "Expense added!", variant: "success" });
      router.push("/finances");
    } catch (err) {
      const e = err as Error;
      toast({ title: e.message ?? "Failed to add expense", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/finances">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">
          {/* Description */}
          <FormField label="Description" required>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Groceries, Rent, Electricity"
              autoFocus
            />
          </FormField>

          {/* Amount + Currency */}
          <div className="flex gap-3">
            <FormField label="Amount" required className="flex-1">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
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

          {/* Paid by */}
          <FormField label="Paid by" required>
            <Select
              value={paidByUserId}
              onValueChange={setPaidByUserId}
              options={memberList.map((m) => ({
                value: m.userId,
                label: m.userId === user?.id ? `${m.name} (you)` : m.name,
              }))}
            />
          </FormField>

          {/* Split editor */}
          {memberList.length > 0 && amountCents > 0 && (
            <FormField label="Split">
              <div className="mt-1">
                <SplitEditor
                  totalCents={amountCents}
                  currency={currency}
                  members={memberList}
                  onChange={setSplits}
                />
              </div>
            </FormField>
          )}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!isValid}
            className="w-full"
          >
            Add expense
          </Button>
        </div>
      </form>
    </div>
  );
}
