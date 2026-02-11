/**
 * Split calculator — deterministic, unit-tested money math
 * All amounts in integer cents.
 */

export type SplitType = "equal" | "percentage" | "exact" | "shares";

export interface SplitInput {
  userId: string;
  percentage?: number;   // for "percentage" split (0–100, sum must equal 100)
  exactCents?: number;   // for "exact" split
  shares?: number;       // for "shares" split (positive integers)
}

export interface SplitResult {
  userId: string;
  amountCents: number;
}

/**
 * Compute splits for a given total and split type.
 * All results are deterministic — same inputs always produce same output.
 */
export function computeSplits(
  totalCents: number,
  splitType: SplitType,
  members: SplitInput[]
): SplitResult[] {
  if (totalCents < 0) throw new Error("totalCents must be non-negative");
  if (members.length === 0) throw new Error("members must not be empty");

  switch (splitType) {
    case "equal":
      return splitEqual(totalCents, members);
    case "percentage":
      return splitByPercentage(totalCents, members);
    case "exact":
      return splitExact(totalCents, members);
    case "shares":
      return splitByShares(totalCents, members);
  }
}

/**
 * Equal split:
 * base = floor(total / n)
 * remainder = total % n
 * First `remainder` members (sorted by userId) get base + 1
 */
function splitEqual(totalCents: number, members: SplitInput[]): SplitResult[] {
  const n = members.length;
  const base = Math.floor(totalCents / n);
  const remainder = totalCents % n;

  // Sort members by userId for deterministic ordering
  const sorted = [...members].sort((a, b) => a.userId.localeCompare(b.userId));

  return sorted.map((m, i) => ({
    userId: m.userId,
    amountCents: i < remainder ? base + 1 : base,
  }));
}

/**
 * Percentage split:
 * raw = totalCents * percentage / 100
 * floor each allocation
 * Distribute remaining cents to members with largest fractional parts
 * Tie-break: higher userId string first (stable)
 */
function splitByPercentage(
  totalCents: number,
  members: SplitInput[]
): SplitResult[] {
  for (const m of members) {
    if (m.percentage === undefined || m.percentage < 0)
      throw new Error(`Member ${m.userId} missing valid percentage`);
  }

  const totalPct = members.reduce((s, m) => s + (m.percentage ?? 0), 0);
  if (Math.abs(totalPct - 100) > 0.001)
    throw new Error(`Percentages must sum to 100, got ${totalPct}`);

  const rawAllocations = members.map((m) => ({
    userId: m.userId,
    raw: totalCents * (m.percentage ?? 0) / 100,
    floored: Math.floor(totalCents * (m.percentage ?? 0) / 100),
    fractional: (totalCents * (m.percentage ?? 0) / 100) % 1,
  }));

  const floordSum = rawAllocations.reduce((s, a) => s + a.floored, 0);
  let remaining = totalCents - floordSum;

  // Sort by fractional desc, then userId desc for tie-break
  const sorted = [...rawAllocations].sort((a, b) => {
    if (Math.abs(b.fractional - a.fractional) > 1e-10)
      return b.fractional - a.fractional;
    return b.userId.localeCompare(a.userId);
  });

  const bonusSet = new Set(sorted.slice(0, remaining).map((a) => a.userId));

  return rawAllocations.map((a) => ({
    userId: a.userId,
    amountCents: a.floored + (bonusSet.has(a.userId) ? 1 : 0),
  }));
}

/**
 * Exact split:
 * Users provide exact cent amounts. Sum must equal totalCents exactly.
 */
function splitExact(totalCents: number, members: SplitInput[]): SplitResult[] {
  for (const m of members) {
    if (m.exactCents === undefined || m.exactCents < 0)
      throw new Error(`Member ${m.userId} missing valid exactCents`);
    if (!Number.isInteger(m.exactCents))
      throw new Error(`Member ${m.userId} exactCents must be an integer`);
  }

  const sum = members.reduce((s, m) => s + (m.exactCents ?? 0), 0);
  if (sum !== totalCents)
    throw new Error(`Exact split sum (${sum}) does not equal total (${totalCents})`);

  return members.map((m) => ({
    userId: m.userId,
    amountCents: m.exactCents ?? 0,
  }));
}

/**
 * Shares split:
 * Convert shares to percentages, then use percentage algorithm.
 * Shares must be positive integers.
 */
function splitByShares(totalCents: number, members: SplitInput[]): SplitResult[] {
  for (const m of members) {
    if (m.shares === undefined || m.shares <= 0 || !Number.isInteger(m.shares))
      throw new Error(`Member ${m.userId} must have a positive integer shares value`);
  }

  const totalShares = members.reduce((s, m) => s + (m.shares ?? 0), 0);

  const withPercentages = members.map((m) => ({
    ...m,
    percentage: ((m.shares ?? 0) / totalShares) * 100,
  }));

  return splitByPercentage(totalCents, withPercentages);
}

/**
 * Validate that splits are internally consistent before calling computeSplits.
 * Returns null if valid, error message if invalid.
 */
export function validateSplits(
  totalCents: number,
  splitType: SplitType,
  members: SplitInput[]
): string | null {
  if (members.length === 0) return "At least one member required";
  if (totalCents <= 0) return "Amount must be greater than 0";

  if (splitType === "percentage") {
    const total = members.reduce((s, m) => s + (m.percentage ?? 0), 0);
    if (Math.abs(total - 100) > 0.1) return `Percentages must sum to 100% (currently ${total.toFixed(1)}%)`;
    for (const m of members) {
      if ((m.percentage ?? 0) < 0) return "Percentages must be non-negative";
    }
  }

  if (splitType === "exact") {
    const sum = members.reduce((s, m) => s + (m.exactCents ?? 0), 0);
    if (sum !== totalCents)
      return `Amounts must sum to ${totalCents / 100} (currently ${sum / 100})`;
  }

  if (splitType === "shares") {
    for (const m of members) {
      if ((m.shares ?? 0) <= 0) return "All shares must be positive";
    }
  }

  return null;
}
