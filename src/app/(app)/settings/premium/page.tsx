"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useSubscription } from "@/hooks/useSubscription";
import { usePolarCheckout } from "@/hooks/usePolarCheckout";
import { formatDate } from "@/lib/money/formatters";
import {
  ArrowLeft,
  Crown,
  CheckSquare,
  Wallet,
  ShoppingCart,
  Check,
  Ban,
} from "lucide-react";
import Link from "next/link";

const PREMIUM_BENEFITS = [
  { category: "Global", icon: Ban, items: ["No more ads"] },
  {
    category: "Chores",
    icon: CheckSquare,
    items: [
      "Chores history",
      "Notes for chores",
      "Search for chores",
      "Custom effort points",
    ],
  },
  {
    category: "Finances",
    icon: Wallet,
    items: [
      "Photos for expenses",
      "Expenses for another person",
      "Settlements archive",
      "Export expenses",
      "Personal spending tracking",
    ],
  },
  {
    category: "Shopping List",
    icon: ShoppingCart,
    items: [
      "Multiple shopping lists",
      "Sort shopping list",
      "Shopping list item details",
      "Photos for shopping list items",
    ],
  },
];

export default function PremiumPage() {
  const { isSubscribed, status, currentPeriodEnd } = useSubscription();
  const { openCheckout } = usePolarCheckout();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Premium</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-muted)] mb-3">
            <Crown className="h-7 w-7 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            CommonGround Pro
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Unlock the full household experience
          </p>
        </div>

        {/* Status */}
        {status !== "none" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {status === "active" && <Badge variant="accent">Active</Badge>}
                    {status === "past_due" && <Badge variant="warning">Past Due</Badge>}
                    {status === "canceled" && <Badge variant="error">Canceled</Badge>}
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Pro Plan</span>
                  </div>
                  {status === "active" && currentPeriodEnd && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Renews {formatDate(currentPeriodEnd)}
                    </p>
                  )}
                  {status === "past_due" && (
                    <p className="text-xs text-[var(--color-warning)] mt-1">
                      Your payment failed. Please update your payment method to keep Pro features.
                    </p>
                  )}
                  {status === "canceled" && currentPeriodEnd && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Access until {formatDate(currentPeriodEnd)}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={openCheckout}>
                  {status === "past_due" ? "Fix Payment" : "Manage"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        {PREMIUM_BENEFITS.map(({ category, icon: CategoryIcon, items }) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <CategoryIcon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-[var(--color-accent)] shrink-0" />
                    <span className="text-[var(--color-text-primary)]">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {/* CTA */}
        {!isSubscribed && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={openCheckout}
          >
            <Crown className="h-4 w-4" />
            {status === "canceled" ? "Resubscribe to Pro" : "Upgrade to Pro"}
          </Button>
        )}
      </div>
    </div>
  );
}
