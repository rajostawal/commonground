"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { COMMON_CURRENCIES } from "@/lib/money/formatters";
import { toast } from "@/hooks/useToast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CreateHouseholdPage() {
  const router = useRouter();
  const createHousehold = useMutation(api.households.createHousehold);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = name.trim().length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      await createHousehold({ name: name.trim(), defaultCurrency: currency });
      toast({ title: "Household created!", variant: "success" });
      router.push("/home");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message ?? "Failed to create household");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Create a household
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Invite your housemates after setup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Household name" required error={name && name.length < 2 ? "At least 2 characters" : undefined}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 42 Oak Street"
            maxLength={50}
            autoFocus
          />
        </FormField>

        <FormField label="Default currency">
          <Select
            value={currency}
            onValueChange={setCurrency}
            options={COMMON_CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
          />
        </FormField>

        {error && (
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!isValid}
          className="w-full"
        >
          Create household
        </Button>
      </form>
    </div>
  );
}
