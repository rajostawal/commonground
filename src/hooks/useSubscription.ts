"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  isSubscribed: boolean;
  isLoading: boolean;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  currentPeriodEnd: number | null;
}

export function useSubscription(): SubscriptionInfo {
  const data = useQuery(api.users.getSubscriptionStatus);

  if (data === undefined) {
    return {
      status: "none",
      isSubscribed: false,
      isLoading: true,
      polarCustomerId: null,
      polarSubscriptionId: null,
      currentPeriodEnd: null,
    };
  }

  if (data === null) {
    return {
      status: "none",
      isSubscribed: false,
      isLoading: false,
      polarCustomerId: null,
      polarSubscriptionId: null,
      currentPeriodEnd: null,
    };
  }

  return {
    status: data.status as SubscriptionStatus,
    isSubscribed: data.status === "active",
    isLoading: false,
    polarCustomerId: data.polarCustomerId,
    polarSubscriptionId: data.polarSubscriptionId,
    currentPeriodEnd: data.currentPeriodEnd,
  };
}
