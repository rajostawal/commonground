import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./helpers";

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
      aiEnabled: true,
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

export const setAiEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    await ctx.db.patch(user._id, { aiEnabled: args.enabled });
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
