"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  ArrowLeft,
  HelpCircle,
  MessageSquare,
  FileText,
  Trash2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Imprint", href: "#" },
];

export default function SupportPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Support & Legal</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  How do I invite someone to my household?
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Go to Settings → Household and share your invite code with them.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  How are expenses split?
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  You can split equally, by percentage, exact amounts, or shares. The app calculates who owes whom.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Can I undo a deleted expense?
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Yes! Go to Activity Log in Settings and use the Undo button on recent actions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              We&apos;d love to hear from you. Let us know what works and what doesn&apos;t.
            </p>
            <a href="mailto:feedback@commonground.app">
              <Button variant="secondary" size="md">
                Send feedback
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {LEGAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] transition-colors"
              >
                {label}
                <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Delete account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-[var(--color-error)]">
              <Trash2 className="h-3.5 w-3.5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" size="md">
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
