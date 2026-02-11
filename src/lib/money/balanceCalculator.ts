/**
 * Balance calculator — computes net balances per member across expenses and settlements.
 * All amounts in integer cents.
 * Positive balance = owed to this person
 * Negative balance = this person owes money
 */

export interface ExpenseRecord {
  paidByUserId: string;
  amountCents: number;
  currency: string;
  splits: { userId: string; amountCents: number }[];
}

export interface SettlementRecord {
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  currency: string;
}

export type CurrencyBalances = Map<string, number>; // userId → netCents
export type BalancesByCurrency = Map<string, CurrencyBalances>; // currency → CurrencyBalances

/**
 * Compute net balances for each member, grouped by currency.
 * For each expense:
 *   - paidBy gets +amountCents credit
 *   - each split member gets -splitAmount debit
 * For each settlement:
 *   - fromUser gets +amountCents (they paid, reducing their debt)
 *   - toUser gets -amountCents (they received, reducing what's owed to them)
 */
export function computeBalances(
  expenses: ExpenseRecord[],
  settlements: SettlementRecord[]
): BalancesByCurrency {
  const result: BalancesByCurrency = new Map();

  function getOrCreateCurrency(currency: string): CurrencyBalances {
    if (!result.has(currency)) {
      result.set(currency, new Map());
    }
    return result.get(currency)!;
  }

  function adjustBalance(currency: string, userId: string, delta: number) {
    const balances = getOrCreateCurrency(currency);
    balances.set(userId, (balances.get(userId) ?? 0) + delta);
  }

  // Process expenses
  for (const expense of expenses) {
    // Payer gets credit for the full amount
    adjustBalance(expense.currency, expense.paidByUserId, expense.amountCents);

    // Each split member is debited their share
    for (const split of expense.splits) {
      adjustBalance(expense.currency, split.userId, -split.amountCents);
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    // fromUser paid toUser: fromUser balance increases (they reduced debt)
    adjustBalance(settlement.currency, settlement.fromUserId, settlement.amountCents);
    // toUser received payment: toUser balance decreases
    adjustBalance(settlement.currency, settlement.toUserId, -settlement.amountCents);
  }

  return result;
}

/**
 * Get per-user net balance for a single currency.
 * Returns a simple Record for easier component use.
 */
export function getNetBalances(
  balancesByCurrency: BalancesByCurrency,
  currency: string
): Record<string, number> {
  const map = balancesByCurrency.get(currency) ?? new Map();
  const result: Record<string, number> = {};
  for (const [userId, amount] of map) {
    result[userId] = amount;
  }
  return result;
}

/**
 * Get total owed by a specific user across a single currency.
 * Negative means they owe money, positive means they're owed money.
 */
export function getUserBalance(
  balancesByCurrency: BalancesByCurrency,
  userId: string,
  currency: string
): number {
  const map = balancesByCurrency.get(currency);
  return map?.get(userId) ?? 0;
}
