import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const createRule = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db.insert("rules", {
      ...args,
      agreedByUserIds: [clerkId], // creator auto-agrees
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });
  },
});

export const updateRule = mutation({
  args: {
    ruleId: v.id("rules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError("Rule not found");
    await requireHouseholdMember(ctx, rule.householdId);

    const { ruleId, ...updates } = args;
    await ctx.db.patch(ruleId, updates);
  },
});

export const deleteRule = mutation({
  args: { ruleId: v.id("rules") },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError("Rule not found");
    await requireHouseholdMember(ctx, rule.householdId);
    await ctx.db.delete(args.ruleId);
  },
});

export const toggleAgree = mutation({
  args: { ruleId: v.id("rules") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) throw new ConvexError("Rule not found");
    await requireHouseholdMember(ctx, rule.householdId);

    const alreadyAgreed = rule.agreedByUserIds.includes(clerkId);
    const agreedByUserIds = alreadyAgreed
      ? rule.agreedByUserIds.filter((id) => id !== clerkId)
      : [...rule.agreedByUserIds, clerkId];

    await ctx.db.patch(args.ruleId, { agreedByUserIds });

    if (!alreadyAgreed) {
      await ctx.db.insert("activityLog", {
        householdId: rule.householdId,
        actorUserId: clerkId,
        type: "rule_agree",
        targetId: args.ruleId,
        targetType: "rule",
        targetDescription: rule.title,
        createdAt: Date.now(),
      });
    }
  },
});

export const listByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("rules")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { ruleId: v.id("rules") },
  handler: async (ctx, args) => {
    const rule = await ctx.db.get(args.ruleId);
    if (!rule) return null;
    await requireHouseholdMember(ctx, rule.householdId);
    return rule;
  },
});
