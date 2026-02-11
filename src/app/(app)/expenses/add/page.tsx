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
import { validateSplits } from "@/lib/money/splitCalculator";
import { ArrowLeft, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<{ splitType: string; rationale: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === "true";

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

  // Fetch AI suggestion when description and amount are filled
  useEffect(() => {
    if (!aiEnabled || !description || description.length < 3 || amountCents < 100) return;
    const timeout = setTimeout(async () => {
      if (!members) return;
      setAiLoading(true);
      try {
        const res = await fetch("/api/ai/suggest-split", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            amountCents,
            memberIds: members.map((m) => m.membership.userId),
            memberNames: Object.fromEntries(
              members.map((m) => [m.membership.userId, m.user?.name ?? "Unknown"])
            ),
          }),
        });
        if (res.ok) {
          const data = await res.json() as { splitType: string; rationale: string };
          setAiSuggestion(data);
        }
      } catch {
        // silently ignore AI errors
      } finally {
        setAiLoading(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [description, amountCents, aiEnabled]);

  const memberList = (members ?? []).map((m) => ({
    userId: m.membership.userId,
    name: m.user?.name ?? "Unknown",
  }));

  const splitError = amountCents > 0 && splits.length > 0
    ? null
    : amountCents > 0
    ? "Configure how to split this expense"
    : null;

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
        splitType: "equal", // We store as-is, split editor validates
        splits,
      });
      toast({ title: "Expense added!", variant: "success" });
      router.push("/expenses");
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
        <Link href="/expenses">
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

          {/* AI suggestion card */}
          {aiEnabled && aiSuggestion && (
            <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-muted)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  <span className="text-xs font-medium text-[var(--color-accent)]">AI Suggestion</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  aria-label="Dismiss AI suggestion"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                {aiSuggestion.rationale}
              </p>
            </div>
          )}

          {/* Split editor */}
          {memberList.length > 0 && amountCents > 0 && (
            <FormField label="Split" error={splitError ?? undefined}>
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
