"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import Link from "next/link";
import { Plus, Wallet, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUser } from "@clerk/nextjs";
import { ExpenseCard } from "@/components/features/ExpenseCard";
import { BalanceSummary } from "@/components/features/BalanceSummary";
import { computeBalances } from "@/lib/money/balanceCalculator";

export default function FinancesPage() {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Finances</h1>
        <div className="flex gap-2">
          <Link href="/finances/contracts">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Contracts
            </Button>
          </Link>
          <Link href="/finances/add">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Balance Summary */}
        {household && members && balanceData && (
          <BalanceSummary
            balanceData={balanceData}
            members={members}
            currency={household.defaultCurrency}
            currentUserId={user?.id ?? ""}
            householdId={household._id}
          />
        )}

        {/* Expenses List */}
        <div>
          <h2 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
            All Expenses
          </h2>

          {expenses === undefined ? (
            <SkeletonList count={4} />
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-8 w-8" />}
              title="No expenses yet"
              description="Add your first shared expense."
              action={
                <Link href="/finances/add">
                  <Button variant="primary" size="md">
                    <Plus className="h-4 w-4" />
                    Add expense
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense._id}
                  expense={expense}
                  currentUserId={user?.id ?? ""}
                  currency={household?.defaultCurrency ?? "USD"}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
