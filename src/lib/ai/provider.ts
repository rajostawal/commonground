export interface SplitSuggestion {
  splitType: "equal" | "percentage" | "exact" | "shares";
  includedMemberIds: string[];
  percentages?: Record<string, number>;
  rationale: string;
}

export interface HouseholdActivityData {
  expenseCount: number;
  totalUnsettledCents: number;
  currency: string;
  choresDue: number;
  choresCompleted: number;
  upcomingEvents: number;
}

export interface AiProvider {
  suggestSplit(
    description: string,
    amountCents: number,
    memberIds: string[],
    memberNames: Record<string, string>
  ): Promise<SplitSuggestion>;

  generateWeeklySummary(data: HouseholdActivityData): Promise<string>;
}
