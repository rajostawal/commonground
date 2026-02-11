"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OnboardingIndexPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="h-12 w-12 rounded-xl bg-[var(--color-accent)] flex items-center justify-center mx-auto">
          <Users className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Welcome to CommonGround
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Create a new household or join an existing one with an invite code.
        </p>
      </div>

      <div className="space-y-3">
        <Link href="/onboarding/create" className="block">
          <Button variant="primary" size="lg" className="w-full">
            <Plus className="h-4 w-4" />
            Create a household
          </Button>
        </Link>
        <Link href="/onboarding/join" className="block">
          <Button variant="secondary" size="lg" className="w-full">
            <Users className="h-4 w-4" />
            Join with invite code
          </Button>
        </Link>
      </div>
    </div>
  );
}
