"use client";

import { useState, useEffect } from "react";
import { computeSplits, validateSplits, type SplitType } from "@/lib/money/splitCalculator";
import { formatCurrency, parseToCents } from "@/lib/money/formatters";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface Member {
  userId: string;
  name: string;
}

interface SplitEditorProps {
  totalCents: number;
  currency: string;
  members: Member[];
  onChange: (splits: { userId: string; amountCents: number; percentage?: number; shares?: number }[]) => void;
  error?: string;
}

const SPLIT_TYPES: { type: SplitType; label: string }[] = [
  { type: "equal", label: "Equal" },
  { type: "percentage", label: "%" },
  { type: "exact", label: "Exact" },
  { type: "shares", label: "Shares" },
];

export function SplitEditor({ totalCents, currency, members, onChange, error }: SplitEditorProps) {
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [includedIds, setIncludedIds] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m.userId, "1"]))
  );

  const included = members.filter((m) => includedIds.has(m.userId));

  // Recompute splits whenever inputs change
  useEffect(() => {
    if (!totalCents || included.length === 0) {
      onChange([]);
      return;
    }

    try {
      const inputs = included.map((m) => ({
        userId: m.userId,
        percentage:
          splitType === "percentage"
            ? parseFloat(percentages[m.userId] ?? "0") || 0
            : undefined,
        exactCents:
          splitType === "exact"
            ? (parseToCents(exactAmounts[m.userId] ?? "0") ?? 0)
            : undefined,
        shares:
          splitType === "shares"
            ? (parseInt(shares[m.userId] ?? "1", 10) || 1)
            : undefined,
      }));

      const validationError = validateSplits(totalCents, splitType, inputs);
      if (!validationError) {
        const result = computeSplits(totalCents, splitType, inputs);
        onChange(
          result.map((r) => ({
            ...r,
            percentage: splitType === "percentage" ? parseFloat(percentages[r.userId] ?? "0") : undefined,
            shares: splitType === "shares" ? (parseInt(shares[r.userId] ?? "1", 10) || 1) : undefined,
          }))
        );
      } else {
        onChange([]);
      }
    } catch {
      onChange([]);
    }
  }, [totalCents, splitType, includedIds, percentages, exactAmounts, shares]);

  function toggleMember(userId: string) {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  // For equal split — show preview
  const equalPreview = splitType === "equal" && totalCents > 0 && included.length > 0
    ? computeSplits(totalCents, "equal", included.map((m) => ({ userId: m.userId })))
    : null;

  const pctTotal = included.reduce(
    (s, m) => s + (parseFloat(percentages[m.userId] ?? "0") || 0),
    0
  );

  return (
    <div className="space-y-3">
      {/* Split type tabs */}
      <div className="flex gap-1 bg-[var(--color-bg-surface-2)] rounded-md p-0.5">
        {SPLIT_TYPES.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => setSplitType(type)}
            className={cn(
              "flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              splitType === type
                ? "bg-[var(--color-bg-surface-3)] text-[var(--color-text-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Member toggles */}
      <div className="flex flex-wrap gap-1.5">
        {members.map((m) => (
          <button
            key={m.userId}
            type="button"
            onClick={() => toggleMember(m.userId)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
              includedIds.has(m.userId)
                ? "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border-[var(--color-accent)]/30"
                : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border-subtle)]"
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Per-member inputs */}
      {splitType === "equal" && equalPreview && (
        <div className="space-y-1">
          {equalPreview.map((r) => {
            const member = members.find((m) => m.userId === r.userId);
            return (
              <div key={r.userId} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)]">{member?.name}</span>
                <span className="font-mono text-[var(--color-text-primary)]">
                  {formatCurrency(r.amountCents, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {splitType === "percentage" && (
        <div className="space-y-2">
          {included.map((m) => (
            <div key={m.userId} className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-secondary)] w-24 truncate">{m.name}</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={percentages[m.userId] ?? ""}
                onChange={(e) => setPercentages((p) => ({ ...p, [m.userId]: e.target.value }))}
                placeholder="0"
                className="w-20 text-right font-mono"
              />
              <span className="text-xs text-[var(--color-text-muted)]">%</span>
            </div>
          ))}
          <p className={cn("text-xs", Math.abs(pctTotal - 100) < 0.1 ? "text-[var(--color-success)]" : "text-[var(--color-error)]")}>
            Total: {pctTotal.toFixed(1)}%
          </p>
        </div>
      )}

      {splitType === "exact" && (
        <div className="space-y-2">
          {included.map((m) => {
            const sumCents = included.reduce(
              (s, mm) => s + (parseToCents(exactAmounts[mm.userId] ?? "0") ?? 0),
              0
            );
            return (
              <div key={m.userId} className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-secondary)] w-24 truncate">{m.name}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exactAmounts[m.userId] ?? ""}
                  onChange={(e) => setExactAmounts((p) => ({ ...p, [m.userId]: e.target.value }))}
                  placeholder="0.00"
                  className="w-24 text-right font-mono"
                />
              </div>
            );
          })}
          {(() => {
            const sumCents = included.reduce(
              (s, m) => s + (parseToCents(exactAmounts[m.userId] ?? "0") ?? 0),
              0
            );
            return (
              <p className={cn("text-xs", sumCents === totalCents ? "text-[var(--color-success)]" : "text-[var(--color-error)]")}>
                Total: {formatCurrency(sumCents, currency)} / {formatCurrency(totalCents, currency)}
              </p>
            );
          })()}
        </div>
      )}

      {splitType === "shares" && (
        <div className="space-y-2">
          {included.map((m) => (
            <div key={m.userId} className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-text-secondary)] w-24 truncate">{m.name}</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={shares[m.userId] ?? "1"}
                onChange={(e) => setShares((p) => ({ ...p, [m.userId]: e.target.value }))}
                className="w-16 text-right font-mono"
              />
              <span className="text-xs text-[var(--color-text-muted)]">shares</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
