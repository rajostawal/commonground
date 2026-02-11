"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { type Id } from "@/../convex/_generated/dataModel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormField";
import { toast } from "@/hooks/useToast";
import { Sparkles, Send, X } from "lucide-react";

interface AISummarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  householdId: Id<"households">;
}

export function AISummarySheet({ open, onOpenChange, householdId }: AISummarySheetProps) {
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);

  const expenses = useQuery(api.expenses.listByHousehold, { householdId, limit: 20 });
  const chores = useQuery(api.chores.listByHousehold, { householdId });
  const events = useQuery(api.events.listByHouseholdByMonth, {
    householdId,
    startTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endTimestamp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const household = useQuery(api.households.getMyHousehold);
  const sendMessage = useMutation(api.messages.sendMessage);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await fetch("/api/ai/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseCount: expenses?.length ?? 0,
          totalUnsettledCents: expenses?.reduce((s, e) => s + e.amountCents, 0) ?? 0,
          currency: household?.defaultCurrency ?? "USD",
          choresDue: chores?.length ?? 0,
          choresCompleted: 0,
          upcomingEvents: events?.length ?? 0,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");
      const data = await response.json() as { summary: string };
      setSummary(data.summary);
    } catch (err) {
      toast({ title: "Failed to generate summary", variant: "error" });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePost() {
    if (!summary.trim()) return;
    setPosting(true);
    try {
      await sendMessage({ householdId, content: summary.trim(), isAnnouncement: true });
      toast({ title: "Posted as announcement!", variant: "success" });
      onOpenChange(false);
      setSummary("");
    } catch {
      toast({ title: "Failed to post", variant: "error" });
    } finally {
      setPosting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
            Weekly Summary
          </SheetTitle>
          <SheetDescription>
            Generate a household summary to post as an announcement.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {!summary ? (
            <div className="text-center py-8 space-y-3">
              <Sparkles className="h-8 w-8 text-[var(--color-text-muted)] mx-auto" />
              <p className="text-sm text-[var(--color-text-muted)]">
                AI will draft a summary based on this week's activity.
              </p>
              <Button
                variant="primary"
                onClick={handleGenerate}
                loading={generating}
              >
                Generate summary
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={8}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setSummary("")}
                  className="flex-1"
                >
                  <X className="h-4 w-4" />
                  Discard
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePost}
                  loading={posting}
                  className="flex-1"
                >
                  <Send className="h-4 w-4" />
                  Post as announcement
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
