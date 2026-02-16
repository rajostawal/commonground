"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/FormField";
import { formatCurrency, formatDate } from "@/lib/money/formatters";
import { computeBalances, getUserBalance } from "@/lib/money/balanceCalculator";
import { toast } from "@/hooks/useToast";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Wallet,
  CheckSquare,
  Calendar,
  Megaphone,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Send,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BulletinBoardPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const messages = useQuery(
    api.messages.listByHousehold,
    household ? { householdId: household._id, limit: 50 } : "skip"
  );
  const members = useQuery(
    api.memberships.listByHousehold,
    household ? { householdId: household._id } : "skip"
  );
  const sendMessage = useMutation(api.messages.sendMessage);

  const [content, setContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const clerkId = user?.id ?? "";
  const firstName = user?.firstName ?? "there";

  const memberMap = Object.fromEntries(
    (members ?? []).map((m) => [
      m.membership.userId,
      { name: m.user?.name ?? "Unknown", imageUrl: m.user?.imageUrl },
    ])
  );

  // Handle checkout result from Polar redirect
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      toast({
        title: "Payment successful!",
        description: "Welcome to Pro. Your features are being activated.",
        variant: "success",
      });
      // Clean the URL param without a full navigation
      router.replace("/bulletin-board", { scroll: false });
    } else if (checkoutStatus === "canceled") {
      toast({
        title: "Checkout canceled",
        description: "No charges were made. You can upgrade anytime from Settings.",
        variant: "default",
      });
      router.replace("/bulletin-board", { scroll: false });
    }
  }, [searchParams, router]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

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

  const myBalance =
    balanceData && clerkId
      ? getUserBalance(balanceData, clerkId, household?.defaultCurrency ?? "USD")
      : null;

  const myChores =
    chores?.filter(
      (c) =>
        c.rotationType === "fixed"
          ? c.assignedMemberIds.includes(clerkId)
          : c.assignedMemberIds[c.currentAssigneeIdx] === clerkId
    ) ?? [];

  // Messages are returned newest-first, reverse for display
  const displayMessages = [...(messages ?? [])].reverse();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !household) return;

    setSending(true);
    try {
      await sendMessage({
        householdId: household._id,
        content: content.trim(),
        isAnnouncement,
      });
      setContent("");
      setIsAnnouncement(false);
    } catch {
      toast({ title: "Failed to send", variant: "error" });
    } finally {
      setSending(false);
    }
  }

  const hasNoContent =
    messages !== undefined &&
    messages.length === 0 &&
    (expenses === undefined || expenses.length === 0) &&
    (chores === undefined || chores.length === 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Hey, {firstName}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {household?.name ?? "Loading..."}
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Quick Overview Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Balance */}
          <Link href="/finances">
            <Card className="hover:border-[var(--color-border-default)] transition-colors cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="h-3 w-3 text-[var(--color-text-muted)]" />
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Balance</span>
                </div>
                {balanceData === null ? (
                  <Skeleton className="h-5 w-12" />
                ) : myBalance === null || myBalance === 0 ? (
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Settled</p>
                ) : myBalance > 0 ? (
                  <p className="text-sm font-semibold font-mono text-[var(--color-success)]">
                    +{formatCurrency(myBalance, household?.defaultCurrency ?? "USD")}
                  </p>
                ) : (
                  <p className="text-sm font-semibold font-mono text-[var(--color-error)]">
                    {formatCurrency(myBalance, household?.defaultCurrency ?? "USD")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Chores Due */}
          <Link href="/chores">
            <Card className="hover:border-[var(--color-border-default)] transition-colors cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckSquare className="h-3 w-3 text-[var(--color-text-muted)]" />
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Chores</span>
                </div>
                {chores === undefined ? (
                  <Skeleton className="h-5 w-8" />
                ) : (
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {myChores.length} due
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Upcoming Events */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3 w-3 text-[var(--color-text-muted)]" />
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Events</span>
              </div>
              {events === undefined ? (
                <Skeleton className="h-5 w-8" />
              ) : (
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {events.length} upcoming
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Unified Feed */}
        {hasNoContent ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Your household feed is empty"
            description="Post your first message!"
          />
        ) : (
          <div className="space-y-3">
            {messages === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-3/4"
                    style={{ marginLeft: i % 2 === 0 ? "auto" : "0" }}
                  />
                ))}
              </div>
            ) : displayMessages.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
                No messages yet. Say hi!
              </p>
            ) : (
              displayMessages.map((msg) => {
                const isMe = msg.authorUserId === clerkId;
                const author = memberMap[msg.authorUserId];
                return (
                  <div
                    key={msg._id}
                    className={cn("flex gap-2.5", isMe && "flex-row-reverse")}
                  >
                    {!isMe && (
                      <Avatar
                        fallback={author?.name ?? "?"}
                        src={author?.imageUrl}
                        size="sm"
                        className="shrink-0 mt-0.5"
                      />
                    )}
                    <div
                      className={cn(
                        "flex flex-col gap-0.5 max-w-[75%]",
                        isMe && "items-end"
                      )}
                    >
                      {!isMe && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {author?.name ?? "Unknown"}
                        </span>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-sm",
                          isMe
                            ? "bg-[var(--color-accent)] text-white rounded-tr-sm"
                            : "bg-[var(--color-bg-surface-2)] text-[var(--color-text-primary)] rounded-tl-sm",
                          msg.isAnnouncement &&
                            "border border-[var(--color-accent)]/50"
                        )}
                      >
                        {msg.isAnnouncement && (
                          <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                            <Megaphone className="h-3 w-3" />
                            Announcement
                          </div>
                        )}
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Message Composer */}
      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)] px-4 py-3">
        <form onSubmit={handleSend} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Message..."
              className="flex-1"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                handleSend(e as unknown as React.FormEvent)
              }
            />
            <Button
              type="submit"
              variant="primary"
              size="icon-md"
              loading={sending}
              disabled={!content.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setIsAnnouncement(!isAnnouncement)}
            className={cn(
              "flex items-center gap-1.5 text-xs self-start rounded px-2 py-1 transition-colors",
              isAnnouncement
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            <Megaphone className="h-3 w-3" />
            Post as announcement
          </button>
        </form>
      </div>
    </div>
  );
}
