"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { toast } from "@/hooks/useToast";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function JoinHouseholdPage() {
  const router = useRouter();
  const joinByInviteCode = useMutation(api.households.joinByInviteCode);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalized = code.trim().toUpperCase();
  const isValid = normalized.length === 6 && /^[A-Z0-9]{6}$/.test(normalized);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      await joinByInviteCode({ inviteCode: normalized });
      toast({ title: "Joined household!", variant: "success" });
      router.push("/home");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message ?? "Invalid invite code");
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
          Join a household
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Enter the 6-character invite code from your housemate.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Invite code"
          required
          error={code && !isValid ? "Must be 6 uppercase letters or numbers" : undefined}
          hint="Ask your housemate to share the code from the Members page."
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="ABCXYZ"
            maxLength={6}
            className="font-mono tracking-[0.2em] text-center text-lg uppercase"
            autoFocus
            autoComplete="off"
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
          Join household
        </Button>
      </form>
    </div>
  );
}
