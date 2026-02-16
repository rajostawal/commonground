"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/money/formatters";
import { User, Mail, Calendar, Home, Shield, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";

export default function ProfileSettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const household = useQuery(api.households.getMyHousehold);
  const membership = useQuery(api.memberships.getMyMembership);
  const myUser = useQuery(api.users.getMyUser);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
        <Link href="/settings">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-3 py-4">
          {user ? (
            <>
              <Avatar fallback={user.fullName ?? "?"} src={user.imageUrl} size="lg" />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {user.fullName ?? "Unknown"}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          )}
        </div>

        {/* Account */}
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-muted)]">Name</p>
                <div className="text-sm text-[var(--color-text-primary)] truncate">
                  {user?.fullName ?? <Skeleton className="h-4 w-24 inline-block" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-muted)]">Email</p>
                <div className="text-sm text-[var(--color-text-primary)] truncate">
                  {user?.primaryEmailAddress?.emailAddress ?? <Skeleton className="h-4 w-32 inline-block" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-muted)]">Joined</p>
                <div className="text-sm text-[var(--color-text-primary)]">
                  {myUser?.createdAt ? formatDate(myUser.createdAt) : <Skeleton className="h-4 w-20 inline-block" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Household */}
        <Card>
          <CardHeader><CardTitle>Household</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Home className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-muted)]">Name</p>
                <div className="text-sm text-[var(--color-text-primary)] truncate">
                  {household?.name ?? <Skeleton className="h-4 w-28 inline-block" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-muted)]">Role</p>
                <div className="mt-0.5">
                  {membership ? (
                    <Badge variant={membership.role === "owner" ? "accent" : "default"}>
                      {membership.role}
                    </Badge>
                  ) : (
                    <Skeleton className="h-5 w-16" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-[var(--color-text-muted)] text-center pt-2">
          To update your name, email, or avatar, use your sign-in provider&apos;s settings.
        </p>

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
