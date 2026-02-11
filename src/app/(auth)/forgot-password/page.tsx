"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSent(true);
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr?.errors?.[0]?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] p-4">
      <div className="w-full max-w-sm">
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mb-8 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        {sent ? (
          <div className="text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-[var(--color-success)] mx-auto" />
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Check your email</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              We sent a reset link to <strong className="text-[var(--color-text-secondary)]">{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Reset your password</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Email" required error={error}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!email}
                className="w-full"
              >
                Send reset link
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
