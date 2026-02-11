import { query } from "./_generated/server";
import { v } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const getMyMembership = query({
  args: {},
  handler: async (ctx) => {
    const clerkId = await getClerkId(ctx);
    if (!clerkId) return null;

    return await ctx.db
      .query("memberships")
      .withIndex("byUserId", (q) => q.eq("userId", clerkId))
      .first();
  },
});

export const listByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byHouseholdId", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Fetch user details for each member
    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db
          .query("users")
          .withIndex("byClerkId", (q) => q.eq("clerkId", m.userId))
          .unique();
        return { membership: m, user };
      })
    );

    return members.filter((m) => m.user !== null);
  },
});
