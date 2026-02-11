/**
 * Debt simplifier — greedy creditor/debtor matching.
 * Minimizes number of transactions to clear all debts.
 * Deterministic with stable ordering.
 */

export interface SettlementSuggestion {
  fromUserId: string;  // who pays
  toUserId: string;    // who receives
  amountCents: number;
  currency: string;
}

/**
 * Simplify debts for a given set of net balances.
 * @param balances Map of userId → netCents (positive = creditor, negative = debtor)
 * @param currency ISO 4217 currency code
 */
export function simplifyDebts(
  balances: Record<string, number>,
  currency: string
): SettlementSuggestion[] {
  const suggestions: SettlementSuggestion[] = [];

  // Separate into creditors (positive) and debtors (negative)
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance > 0) creditors.push({ userId, amount: balance });
    else if (balance < 0) debtors.push({ userId, amount: Math.abs(balance) });
    // Zero balance: skip
  }

  // Sort creditors: largest amount first, then userId desc for tie-break
  creditors.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return b.userId.localeCompare(a.userId);
  });

  // Sort debtors: largest debt first (most negative), then userId desc for tie-break
  debtors.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return b.userId.localeCompare(a.userId);
  });

  // Greedy matching
  let ci = 0; // creditor pointer
  let di = 0; // debtor pointer

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;

    const settlement = Math.min(creditor.amount, debtor.amount);

    suggestions.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amountCents: settlement,
      currency,
    });

    creditor.amount -= settlement;
    debtor.amount -= settlement;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return suggestions;
}

/**
 * Simplify debts across multiple currencies independently.
 * Returns suggestions grouped by currency.
 */
export function simplifyDebtsByCurrency(
  balancesByCurrency: Map<string, Map<string, number>>
): SettlementSuggestion[] {
  const allSuggestions: SettlementSuggestion[] = [];

  for (const [currency, balances] of balancesByCurrency) {
    const balanceRecord: Record<string, number> = {};
    for (const [userId, amount] of balances) {
      balanceRecord[userId] = amount;
    }
    allSuggestions.push(...simplifyDebts(balanceRecord, currency));
  }

  return allSuggestions;
}
