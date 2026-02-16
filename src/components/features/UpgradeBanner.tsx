"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Crown, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function UpgradeBanner() {
  const { isSubscribed, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || isSubscribed || dismissed) return null;

  return (
    <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 border-b border-[var(--color-accent)]/20">
      <div className="flex items-center gap-2 min-w-0">
        <Crown className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          <span className="font-medium text-[var(--color-text-primary)]">
            Upgrade to Pro
          </span>
          {" "}&mdash; Photos, history, search, multiple lists, and more.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/settings/premium"
          className="inline-flex items-center rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
        >
          Upgrade
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] p-0.5"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
