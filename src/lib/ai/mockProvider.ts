import { type AiProvider, type SplitSuggestion, type HouseholdActivityData } from "./provider";
import { formatCurrency } from "@/lib/money/formatters";

export class MockAiProvider implements AiProvider {
  async suggestSplit(
    description: string,
    amountCents: number,
    memberIds: string[],
    _memberNames: Record<string, string>
  ): Promise<SplitSuggestion> {
    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 400));

    // Simple heuristic: use description keywords
    const lowerDesc = description.toLowerCase();
    const isGroceries = lowerDesc.includes("grocer") || lowerDesc.includes("food") || lowerDesc.includes("market");
    const isRent = lowerDesc.includes("rent") || lowerDesc.includes("utilities") || lowerDesc.includes("electric");

    if (isRent) {
      return {
        splitType: "equal",
        includedMemberIds: memberIds,
        rationale: "Rent and utilities are typically split equally among all housemates.",
      };
    }

    if (isGroceries) {
      return {
        splitType: "equal",
        includedMemberIds: memberIds,
        rationale: "Groceries are usually shared equally. Adjust if only some people will use them.",
      };
    }

    // Default: equal split
    return {
      splitType: "equal",
      includedMemberIds: memberIds,
      rationale: "Equal split suggested as a starting point. Adjust as needed.",
    };
  }

  async generateWeeklySummary(data: HouseholdActivityData): Promise<string> {
    await new Promise((r) => setTimeout(r, 600));

    const lines: string[] = ["📊 Weekly Household Summary\n"];

    if (data.expenseCount > 0) {
      lines.push(`💰 ${data.expenseCount} expense${data.expenseCount !== 1 ? "s" : ""} recorded this week.`);
    }

    if (data.totalUnsettledCents > 0) {
      lines.push(`📈 Total unsettled: ${formatCurrency(data.totalUnsettledCents, data.currency)}`);
    } else {
      lines.push("✅ All expenses settled up!");
    }

    if (data.choresCompleted > 0 || data.choresDue > 0) {
      lines.push(`🧹 Chores: ${data.choresCompleted} completed, ${data.choresDue} due.`);
    }

    if (data.upcomingEvents > 0) {
      lines.push(`📅 ${data.upcomingEvents} upcoming event${data.upcomingEvents !== 1 ? "s" : ""} this week.`);
    }

    lines.push("\nRemember to settle up if you owe anything! 🏠");

    return lines.join("\n");
  }
}
