"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";
import { parseToCents, COMMON_CURRENCIES } from "@/lib/money/formatters";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const CONTRACT_TYPES = [
  { value: "rent", label: "Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "internet", label: "Internet" },
  { value: "insurance", label: "Insurance" },
  { value: "streaming", label: "Streaming" },
  { value: "other", label: "Other" },
];

const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export default function AddContractPage() {
  const router = useRouter();
  const household = useQuery(api.households.getMyHousehold);
  const createContract = useMutation(api.contracts.createContract);

  const [name, setName] = useState("");
  const [type, setType] = useState<"rent" | "electricity" | "water" | "internet" | "insurance" | "streaming" | "other">("rent");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState(household?.defaultCurrency ?? "USD");
  const [frequency, setFrequency] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [dueDayStr, setDueDayStr] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (household?.defaultCurrency) {
      setCurrency(household.defaultCurrency);
    }
  }, [household?.defaultCurrency]);

  const amountCents = parseToCents(amountStr) ?? 0;
  const dueDay = dueDayStr ? parseInt(dueDayStr) : undefined;

  const isValid = name.trim().length >= 1 && amountCents > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !household) return;

    setLoading(true);
    try {
      await createContract({
        householdId: household._id,
        name: name.trim(),
        type,
        amountCents,
        currency,
        frequency,
        dueDay: dueDay && dueDay >= 1 && dueDay <= 31 ? dueDay : undefined,
        notes: notes.trim() || undefined,
      });
      toast({ title: "Contract added!", variant: "success" });
      router.push("/finances/contracts");
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed to add contract", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/finances/contracts">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Add Contract</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-5 max-w-lg mx-auto">
          <FormField label="Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent, Netflix, Electricity"
              autoFocus
            />
          </FormField>

          <FormField label="Type">
            <Select
              value={type}
              onValueChange={(v) => setType(v as typeof type)}
              options={CONTRACT_TYPES}
            />
          </FormField>

          <div className="flex gap-3">
            <FormField label="Amount" required className="flex-1">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
            </FormField>
            <FormField label="Currency" className="w-28">
              <Select
                value={currency}
                onValueChange={setCurrency}
                options={COMMON_CURRENCIES.map((c) => ({ value: c.code, label: c.code }))}
              />
            </FormField>
          </div>

          <div className="flex gap-3">
            <FormField label="Frequency" className="flex-1">
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as typeof frequency)}
                options={FREQUENCIES}
              />
            </FormField>
            <FormField label="Due day" className="w-24">
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDayStr}
                onChange={(e) => setDueDayStr(e.target.value)}
                placeholder="1-31"
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </FormField>
        </div>

        <div className="sticky bottom-0 px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-1)]">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!isValid}
            className="w-full"
          >
            Add contract
          </Button>
        </div>
      </form>
    </div>
  );
}
