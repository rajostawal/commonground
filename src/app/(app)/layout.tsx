"use client";

import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PolarCheckoutInit } from "@/components/PolarCheckoutInit";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const { user, isLoaded: clerkLoaded } = useUser();
  const membership = useQuery(
    api.memberships.getMyMembership,
    isAuthenticated ? {} : "skip"
  );
  const upsertUser = useMutation(api.users.upsertUser);
  const router = useRouter();

  // Sync Clerk user to Convex users table once Convex has the token
  useEffect(() => {
    if (isAuthenticated && user) {
      upsertUser({
        name: user.fullName ?? user.firstName ?? "User",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        imageUrl: user.imageUrl,
      }).catch(console.error);
    }
  }, [isAuthenticated, user, upsertUser]);

  // Redirect to onboarding if user has no household
  useEffect(() => {
    if (isAuthenticated && membership === null) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, membership, router]);

  // Loading: wait for Clerk, Convex auth, and membership. If Clerk is loaded but Convex
  // is not authenticated (e.g. missing CLERK_JWT_ISSUER_DOMAIN), keep showing loading.
  const waitingForAuth =
    !clerkLoaded || convexAuthLoading || (clerkLoaded && !isAuthenticated);
  if (waitingForAuth || (isAuthenticated && membership === undefined)) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && membership === null) return null;

  return (
    <>
      <PolarCheckoutInit />
      <AppShell>{children}</AppShell>
    </>
  );
}
