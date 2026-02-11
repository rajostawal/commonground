import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const sendMessage = mutation({
  args: {
    householdId: v.id("households"),
    content: v.string(),
    isAnnouncement: v.boolean(),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db.insert("messages", {
      householdId: args.householdId,
      authorUserId: clerkId,
      content: args.content.trim(),
      isAnnouncement: args.isAnnouncement,
      createdAt: Date.now(),
    });
  },
});

export const listByHousehold = query({
  args: {
    householdId: v.id("households"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("messages")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const listAnnouncements = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(200);

    return messages.filter((m) => m.isAnnouncement);
  },
});

export const getLatestAnnouncement = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(50);

    return messages.find((m) => m.isAnnouncement) ?? null;
  },
});
