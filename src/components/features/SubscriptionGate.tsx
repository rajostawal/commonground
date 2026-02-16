"use client";

import { type ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePolarCheckout } from "@/hooks/usePolarCheckout";
import { Lock, Crown } from "lucide-react";
import Link from "next/link";

interface SubscriptionGateProps {
  children: ReactNode;
  featureName?: string;
  /** When true, renders centered in the full available space (flex-1) */
  fullPage?: boolean;
}

export function SubscriptionGate({
  children,
  featureName = "This feature",
  fullPage = false,
}: SubscriptionGateProps) {
  const { isSubscribed, isLoading } = useSubscription();
  const { openCheckout } = usePolarCheckout();

  if (isSubscribed) return <>{children}</>;

  // While loading, show a minimal placeholder instead of rendering children (which cause skeleton flashes)
  if (isLoading) {
    return fullPage ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--color-border-default)] border-t-[var(--color-accent)] animate-spin" />
      </div>
    ) : null;
  }

  if (fullPage) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-muted)] mb-3">
            <Crown className="h-6 w-6 text-[var(--color-accent)]" />
          </div>
          <p className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
            Pro Feature
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            {featureName} requires a Pro subscription.
          </p>
          <button
            type="button"
            onClick={openCheckout}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </button>
          <Link
            href="/settings/premium"
            className="block mt-3 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Learn more about Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none" aria-hidden>
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-base)]/60 backdrop-blur-[2px] rounded-lg">
        <div className="text-center px-6 py-4 max-w-xs">
          <Lock className="h-6 w-6 text-[var(--color-text-muted)] mx-auto mb-2" />
          <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Pro Feature
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            {featureName} requires a Pro subscription.
          </p>
          <button
            type="button"
            onClick={openCheckout}
            className="inline-flex items-center rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
