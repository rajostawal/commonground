import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});

export const getMyUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const getUsersByClerkIds = query({
  args: { clerkIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.clerkIds.map((id) =>
        ctx.db
          .query("users")
          .withIndex("byClerkId", (q) => q.eq("clerkId", id))
          .unique()
      )
    );
    return users.filter(Boolean);
  },
});

// ── Subscription ──────────────────────────────────────────────────────────────

export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    return {
      status: user.subscriptionStatus ?? "none",
      polarCustomerId: user.polarCustomerId ?? null,
      polarSubscriptionId: user.polarSubscriptionId ?? null,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
    };
  },
});

export const updateSubscription = internalMutation({
  args: {
    email: v.string(),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("none")
    ),
    subscriptionCurrentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byEmail", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      console.error(`Polar webhook: No user found for email ${args.email}`);
      return;
    }

    await ctx.db.patch(user._id, {
      polarCustomerId: args.polarCustomerId,
      polarSubscriptionId: args.polarSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionCurrentPeriodEnd: args.subscriptionCurrentPeriodEnd,
    });
  },
});

