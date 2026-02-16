import { Webhooks } from "@polar-sh/nextjs";
import { ConvexHttpClient } from "convex/browser";
import { internal } from "@/../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// setAdminAuth is an internal Convex API that exists at runtime but isn't in the type defs.
// It's needed to call internalMutation from server-side webhook handlers.
const convexAdmin = convex as ConvexHttpClient & {
  setAdminAuth(token: string): void;
};

function mapStatus(status: string): "active" | "canceled" | "past_due" | "none" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "none";
  }
}

async function updateSubscription(
  email: string,
  customerId: string,
  subscriptionId: string,
  status: "active" | "canceled" | "past_due" | "none",
  periodEnd?: Date | null
) {
  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) {
    console.error("Polar webhook: CONVEX_DEPLOY_KEY is not set — cannot update subscription");
    throw new Error("Server misconfiguration: CONVEX_DEPLOY_KEY missing");
  }

  convexAdmin.setAdminAuth(deployKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await convex.mutation(internal.users.updateSubscription as any, {
    email,
    polarCustomerId: customerId,
    polarSubscriptionId: subscriptionId,
    subscriptionStatus: status,
    subscriptionCurrentPeriodEnd: periodEnd
      ? periodEnd.getTime()
      : undefined,
  });
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onSubscriptionCreated: async (payload) => {
    const sub = payload.data;
    console.log(`Polar webhook: subscription.created for ${sub.customer.email} — status: ${sub.status}`);
    await updateSubscription(
      sub.customer.email,
      sub.customer.id,
      sub.id,
      mapStatus(sub.status),
      sub.currentPeriodEnd
    );
  },
  onSubscriptionUpdated: async (payload) => {
    const sub = payload.data;
    console.log(`Polar webhook: subscription.updated for ${sub.customer.email} — status: ${sub.status}`);
    await updateSubscription(
      sub.customer.email,
      sub.customer.id,
      sub.id,
      mapStatus(sub.status),
      sub.currentPeriodEnd
    );
  },
  onSubscriptionActive: async (payload) => {
    const sub = payload.data;
    console.log(`Polar webhook: subscription.active for ${sub.customer.email}`);
    await updateSubscription(
      sub.customer.email,
      sub.customer.id,
      sub.id,
      "active",
      sub.currentPeriodEnd
    );
  },
  onSubscriptionCanceled: async (payload) => {
    const sub = payload.data;
    console.log(`Polar webhook: subscription.canceled for ${sub.customer.email}`);
    await updateSubscription(
      sub.customer.email,
      sub.customer.id,
      sub.id,
      "canceled",
      sub.currentPeriodEnd
    );
  },
  onSubscriptionRevoked: async (payload) => {
    const sub = payload.data;
    console.log(`Polar webhook: subscription.revoked for ${sub.customer.email}`);
    await updateSubscription(
      sub.customer.email,
      sub.customer.id,
      sub.id,
      "none"
    );
  },
});
