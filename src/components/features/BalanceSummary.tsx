"use client";

import Link from "next/link";
import { type Id } from "@/../convex/_generated/dataModel";
import { formatCurrency } from "@/lib/money/formatters";
import { type BalancesByCurrency } from "@/lib/money/balanceCalculator";
import { simplifyDebts } from "@/lib/money/debtSimplifier";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  membership: { userId: string; role: string };
  user: { name: string; _id: string } | null;
}

interface BalanceSummaryProps {
  balanceData: BalancesByCurrency;
  members: Member[];
  currency: string;
  currentUserId: string;
  householdId: Id<"households">;
}

export function BalanceSummary({
  balanceData,
  members,
  currency,
  currentUserId,
  householdId,
}: BalanceSummaryProps) {
  const balances = balanceData.get(currency);
  if (!balances || balances.size === 0) return null;

  const balanceRecord: Record<string, number> = {};
  for (const [userId, amount] of balances) {
    if (amount !== 0) balanceRecord[userId] = amount;
  }

  const suggestions = simplifyDebts(balanceRecord, currency);

  const memberNameMap = Object.fromEntries(
    members.map((m) => [m.membership.userId, m.user?.name ?? "Unknown"])
  );

  const myBalance = balances.get(currentUserId) ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Balances</CardTitle>
          <Link href={`/finances/settlements`}>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Settlements <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* My net balance */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--color-border-subtle)]">
          {myBalance === 0 ? (
            <Badge variant="success">All settled up</Badge>
          ) : myBalance > 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">You are owed</span>
              <span className="text-sm font-semibold font-mono text-[var(--color-success)]">
                {formatCurrency(myBalance, currency)}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-[var(--color-error)]" />
              <span className="text-sm text-[var(--color-text-secondary)]">You owe</span>
              <span className="text-sm font-semibold font-mono text-[var(--color-error)]">
                {formatCurrency(Math.abs(myBalance), currency)}
              </span>
            </>
          )}
        </div>

        {/* Settlement suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">Suggested settlements</p>
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between text-sm rounded-md px-2 py-1.5",
                  (s.fromUserId === currentUserId || s.toUserId === currentUserId)
                    ? "bg-[var(--color-accent-muted)]"
                    : "bg-[var(--color-bg-surface-2)]"
                )}
              >
                <span className="text-[var(--color-text-secondary)]">
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {memberNameMap[s.fromUserId] ?? "Unknown"}
                  </span>
                  {" → "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {memberNameMap[s.toUserId] ?? "Unknown"}
                  </span>
                </span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {formatCurrency(s.amountCents, s.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
