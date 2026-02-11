import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import {
  getClerkId,
  getMyMembership,
  generateInviteCode,
  requireHouseholdMember,
} from "./helpers";

export const createHousehold = mutation({
  args: {
    name: v.string(),
    defaultCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);

    // Ensure user doesn't already have a household
    const existing = await getMyMembership(ctx);
    if (existing) throw new ConvexError("Already a member of a household");

    // Generate unique invite code
    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      const conflict = await ctx.db
        .query("households")
        .withIndex("byInviteCode", (q) => q.eq("inviteCode", inviteCode))
        .unique();
      if (!conflict) break;
      attempts++;
    } while (attempts < 10);

    const householdId = await ctx.db.insert("households", {
      name: args.name.trim(),
      inviteCode: inviteCode!,
      defaultCurrency: args.defaultCurrency,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("memberships", {
      userId: clerkId,
      householdId,
      role: "owner",
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLog", {
      householdId,
      actorUserId: clerkId,
      type: "member_join",
      targetDescription: "Created household",
      createdAt: Date.now(),
    });

    return householdId;
  },
});

export const joinByInviteCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const normalized = args.inviteCode.trim().toUpperCase();

    const household = await ctx.db
      .query("households")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", normalized))
      .unique();

    if (!household) throw new ConvexError("Invalid invite code");

    // Check if already a member (idempotent)
    const existing = await ctx.db
      .query("memberships")
      .withIndex("byUserIdAndHouseholdId", (q) =>
        q.eq("userId", clerkId).eq("householdId", household._id)
      )
      .unique();

    if (existing) return { householdId: household._id, alreadyMember: true };

    // Check if user is in another household
    const otherMembership = await getMyMembership(ctx);
    if (otherMembership) throw new ConvexError("Already a member of a household");

    await ctx.db.insert("memberships", {
      userId: clerkId,
      householdId: household._id,
      role: "member",
      createdAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      householdId: household._id,
      actorUserId: clerkId,
      type: "member_join",
      targetDescription: "Joined household",
      createdAt: Date.now(),
    });

    return { householdId: household._id, alreadyMember: false };
  },
});

export const getMyHousehold = query({
  args: {},
  handler: async (ctx) => {
    const membership = await getMyMembership(ctx);
    if (!membership) return null;

    const household = await ctx.db.get(membership.householdId);
    return household;
  },
});

export const getHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);
    return await ctx.db.get(args.householdId);
  },
});

export const updateHousehold = mutation({
  args: {
    householdId: v.id("households"),
    name: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    const before = await ctx.db.get(args.householdId);
    const updates: Record<string, unknown> = {};
    if (args.name) updates.name = args.name.trim();
    if (args.defaultCurrency) updates.defaultCurrency = args.defaultCurrency;

    await ctx.db.patch(args.householdId, updates);

    await ctx.db.insert("activityLog", {
      householdId: args.householdId,
      actorUserId: clerkId,
      type: "household_settings_change",
      before: { name: before?.name, defaultCurrency: before?.defaultCurrency },
      after: updates,
      targetDescription: "Updated household settings",
      createdAt: Date.now(),
    });
  },
});

export const leaveHousehold = mutation({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const membership = await requireHouseholdMember(ctx, args.householdId);

    await ctx.db.delete(membership._id);

    await ctx.db.insert("activityLog", {
      householdId: args.householdId,
      actorUserId: clerkId,
      type: "member_leave",
      targetDescription: "Left household",
      createdAt: Date.now(),
    });
  },
});

export const regenerateInviteCode = mutation({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      const conflict = await ctx.db
        .query("households")
        .withIndex("byInviteCode", (q) => q.eq("inviteCode", inviteCode))
        .unique();
      if (!conflict) break;
      attempts++;
    } while (attempts < 10);

    await ctx.db.patch(args.householdId, { inviteCode: inviteCode! });
    return inviteCode!;
  },
});
