"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/money/formatters";
import { computeBalances, getUserBalance } from "@/lib/money/balanceCalculator";
import Link from "next/link";
import {
  DollarSign,
  CheckSquare,
  Calendar,
  Megaphone,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useState, useMemo } from "react";
import { AISummarySheet } from "@/components/features/AISummarySheet";

export default function HomePage() {
  const { user } = useUser();
  const household = useQuery(api.households.getMyHousehold);
  const expenses = useQuery(
    api.expenses.listByHousehold,
    household ? { householdId: household._id, limit: 5 } : "skip"
  );
  const settlements = useQuery(
    api.settlements.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const chores = useQuery(
    api.chores.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const upcomingRange = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return { start: startOfDay, end: startOfDay + 14 * 24 * 60 * 60 * 1000 };
  }, []);

  const events = useQuery(
    api.events.listByHouseholdByMonth,
    household
      ? {
          householdId: household._id,
          startTimestamp: upcomingRange.start,
          endTimestamp: upcomingRange.end,
        }
      : "skip"
  );
  const latestAnnouncement = useQuery(
    api.messages.getLatestAnnouncement,
    household ? { householdId: household._id } : "skip"
  );

  const [showAISummary, setShowAISummary] = useState(false);
  const clerkId = user?.id;

  // Compute balances
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

  const myBalance = balanceData && clerkId
    ? getUserBalance(balanceData, clerkId, household?.defaultCurrency ?? "USD")
    : null;

  const myChores =
    chores?.filter(
      (c) =>
        c.rotationType === "fixed"
          ? c.assignedMemberIds.includes(clerkId ?? "")
          : c.assignedMemberIds[c.currentAssigneeIdx] === clerkId
    ) ?? [];

  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === "true";

  const firstName = user?.firstName ?? "there";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Hey, {firstName} 👋
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {household?.name ?? "Loading..."}
          </p>
        </div>
        {aiEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAISummary(true)}
            className="gap-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Weekly summary</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                Balance
              </CardTitle>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {balanceData === null ? (
              <Skeleton className="h-10 w-32" />
            ) : myBalance === null ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
            ) : myBalance === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                  All settled up
                </span>
              </div>
            ) : myBalance > 0 ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--color-success)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">You are owed</p>
                  <p className="text-2xl font-bold font-mono text-[var(--color-success)]">
                    {formatCurrency(myBalance, household?.defaultCurrency ?? "USD")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-[var(--color-error)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">You owe</p>
                  <p className="text-2xl font-bold font-mono text-[var(--color-error)]">
                    {formatCurrency(Math.abs(myBalance), household?.defaultCurrency ?? "USD")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Chores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                My Chores
              </CardTitle>
              <Link href="/chores">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {chores === undefined ? (
              <Skeleton className="h-8 w-full" />
            ) : myChores.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No chores assigned to you.</p>
            ) : (
              <ul className="space-y-1.5">
                {myChores.slice(0, 3).map((chore) => (
                  <li key={chore._id} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-primary)]">{chore.title}</span>
                    <Badge variant="default">{chore.frequency}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                Upcoming
              </CardTitle>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {events === undefined ? (
              <Skeleton className="h-8 w-full" />
            ) : events.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No upcoming events.</p>
            ) : (
              <ul className="space-y-1.5">
                {events.slice(0, 3).map((event) => (
                  <li key={event._id} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-primary)]">{event.title}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(event.startDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                Recent Expenses
              </CardTitle>
              <Link href="/expenses">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {expenses === undefined ? (
              <Skeleton className="h-8 w-full" />
            ) : expenses.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No expenses yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {expenses.slice(0, 3).map((expense) => (
                  <li key={expense._id} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {expense.description}
                    </span>
                    <span className="text-sm font-mono text-[var(--color-text-secondary)]">
                      {formatCurrency(expense.amountCents, expense.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Activity shortcut */}
        <Link href="/activity">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] p-3 hover:border-[var(--color-border-default)] transition-colors">
            <Activity className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span className="text-sm text-[var(--color-text-primary)] flex-1">Activity log</span>
            <ArrowRight className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          </div>
        </Link>

        {/* Latest Announcement */}
        {(latestAnnouncement || latestAnnouncement === undefined) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                  Latest Announcement
                </CardTitle>
                <Link href="/more/announcements">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {latestAnnouncement === undefined ? (
                <Skeleton className="h-8 w-full" />
              ) : latestAnnouncement === null ? (
                <p className="text-sm text-[var(--color-text-muted)]">No announcements yet.</p>
              ) : (
                <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                  {latestAnnouncement.content}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {household && (
        <AISummarySheet
          open={showAISummary}
          onOpenChange={setShowAISummary}
          householdId={household._id}
        />
      )}
    </div>
  );
}
