import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const createChore = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    description: v.optional(v.string()),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("as-needed")
    ),
    rotationType: v.union(v.literal("fixed"), v.literal("round-robin")),
    assignedMemberIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db.insert("chores", {
      ...args,
      currentAssigneeIdx: 0,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });
  },
});

export const updateChore = mutation({
  args: {
    choreId: v.id("chores"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    frequency: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("biweekly"),
        v.literal("monthly"),
        v.literal("as-needed")
      )
    ),
    rotationType: v.optional(
      v.union(v.literal("fixed"), v.literal("round-robin"))
    ),
    assignedMemberIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const chore = await ctx.db.get(args.choreId);
    if (!chore) throw new ConvexError("Chore not found");
    await requireHouseholdMember(ctx, chore.householdId);

    const { choreId, ...updates } = args;
    await ctx.db.patch(choreId, updates);
  },
});

export const deleteChore = mutation({
  args: { choreId: v.id("chores") },
  handler: async (ctx, args) => {
    const chore = await ctx.db.get(args.choreId);
    if (!chore) throw new ConvexError("Chore not found");
    await requireHouseholdMember(ctx, chore.householdId);
    await ctx.db.delete(args.choreId);
  },
});

export const completeChore = mutation({
  args: {
    choreId: v.id("chores"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const chore = await ctx.db.get(args.choreId);
    if (!chore) throw new ConvexError("Chore not found");
    await requireHouseholdMember(ctx, chore.householdId);

    // Record completion
    await ctx.db.insert("choreCompletions", {
      choreId: args.choreId,
      householdId: chore.householdId,
      completedByUserId: clerkId,
      completedAt: Date.now(),
      notes: args.notes,
    });

    // Advance rotation if round-robin
    if (chore.rotationType === "round-robin" && chore.assignedMemberIds.length > 0) {
      const nextIdx =
        (chore.currentAssigneeIdx + 1) % chore.assignedMemberIds.length;
      await ctx.db.patch(args.choreId, { currentAssigneeIdx: nextIdx });
    }

    await ctx.db.insert("activityLog", {
      householdId: chore.householdId,
      actorUserId: clerkId,
      type: "chore_complete",
      targetId: args.choreId,
      targetType: "chore",
      targetDescription: chore.title,
      createdAt: Date.now(),
    });
  },
});

export const listByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("chores")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { choreId: v.id("chores") },
  handler: async (ctx, args) => {
    const chore = await ctx.db.get(args.choreId);
    if (!chore) return null;
    await requireHouseholdMember(ctx, chore.householdId);

    const completions = await ctx.db
      .query("choreCompletions")
      .withIndex("byChoreId", (q) => q.eq("choreId", args.choreId))
      .order("desc")
      .take(10);

    return { chore, completions };
  },
});
