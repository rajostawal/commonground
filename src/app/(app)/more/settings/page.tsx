"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "@/hooks/useToast";
import { COMMON_CURRENCIES } from "@/lib/money/formatters";
import { Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import * as RadixSwitch from "@radix-ui/react-switch";

export default function SettingsPage() {
  const { signOut } = useClerk();
  const household = useQuery(api.households.getMyHousehold);
  const myUser = useQuery(api.users.getMyUser);
  const updateHousehold = useMutation(api.households.updateHousehold);
  const setAiEnabled = useMutation(api.users.setAiEnabled);

  const [currency, setCurrency] = useState(household?.defaultCurrency ?? "USD");
  const [savingCurrency, setSavingCurrency] = useState(false);

  async function handleCurrencyChange(newCurrency: string) {
    if (!household || newCurrency === household.defaultCurrency) return;
    setCurrency(newCurrency);
    setSavingCurrency(true);
    try {
      await updateHousehold({ householdId: household._id, defaultCurrency: newCurrency });
      toast({ title: "Default currency updated", variant: "success" });
    } catch (err) {
      toast({ title: (err as Error).message ?? "Failed", variant: "error" });
      setCurrency(household.defaultCurrency);
    } finally {
      setSavingCurrency(false);
    }
  }

  async function handleAiToggle(enabled: boolean) {
    try {
      await setAiEnabled({ enabled });
      toast({ title: enabled ? "AI Assist enabled" : "AI Assist disabled", variant: "default" });
    } catch {
      toast({ title: "Failed to update AI setting", variant: "error" });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Household settings */}
        <Card>
          <CardHeader><CardTitle>Household</CardTitle></CardHeader>
          <CardContent>
            <FormField label="Default currency">
              <Select
                value={currency}
                onValueChange={handleCurrencyChange}
                options={COMMON_CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
                disabled={savingCurrency}
              />
            </FormField>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Any member can change this. New expenses will default to this currency.
            </p>
          </CardContent>
        </Card>

        {/* AI settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              AI Assist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-primary)]">Enable AI features</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Split suggestions and weekly summaries.
                </p>
              </div>
              <RadixSwitch.Root
                checked={myUser?.aiEnabled ?? true}
                onCheckedChange={handleAiToggle}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  myUser?.aiEnabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-bg-surface-3)]"
                )}
              >
                <RadixSwitch.Thumb
                  className={cn(
                    "block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    "translate-x-1 data-[state=checked]:translate-x-6"
                  )}
                />
              </RadixSwitch.Root>
            </div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <Button
          variant="destructive"
          size="md"
          className="w-full"
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
