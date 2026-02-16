"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, Bell, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/useToast";

export default function GeneralSettingsPage() {
  function handleTestNotification() {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("CommonGround", {
            body: "Notifications are working!",
          });
          toast({ title: "Test notification sent", variant: "success" });
        } else {
          toast({ title: "Notification permission denied", variant: "error" });
        }
      });
    } else {
      toast({ title: "Notifications not supported in this browser", variant: "error" });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">General</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="md" onClick={handleTestNotification}>
              Send test notification
            </Button>
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Make sure notifications are working on your device.
            </p>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-text-primary)]">English</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              More languages coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
