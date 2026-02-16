import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const listByHousehold = query({
  args: {
    householdId: v.id("households"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("activityLog")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getUndoableActions = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    const undoableTypes = [
      "expense_create",
      "expense_edit",
      "expense_delete",
      "settlement_create",
      "settlement_delete",
    ];

    // Get last 10 undoable actions by this user that haven't been undone
    const actions = await ctx.db
      .query("activityLog")
      .withIndex("byActorUserId", (q) => q.eq("actorUserId", clerkId))
      .order("desc")
      .collect();

    return actions
      .filter(
        (a) =>
          undoableTypes.includes(a.type) &&
          !a.undoneAt &&
          a.householdId === args.householdId
      )
      .slice(0, 10);
  },
});

export const undoAction = mutation({
  args: { logId: v.id("activityLog") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const log = await ctx.db.get(args.logId);
    if (!log) throw new ConvexError("Action not found");
    if (log.actorUserId !== clerkId)
      throw new ConvexError("Cannot undo another user's action");
    if (log.undoneAt) throw new ConvexError("Action already undone");

    await requireHouseholdMember(ctx, log.householdId);

    // Perform the undo based on action type
    if (log.type === "expense_create" && log.targetId) {
      const expense = await ctx.db
        .query("expenses")
        .filter((q) => q.eq(q.field("_id"), log.targetId))
        .first();
      if (expense) await ctx.db.delete(expense._id);
    } else if (log.type === "expense_edit" && log.targetId && log.before) {
      const expense = await ctx.db
        .query("expenses")
        .filter((q) => q.eq(q.field("_id"), log.targetId))
        .first();
      if (expense) {
        const { _id, _creationTime, ...beforeData } = log.before as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.db.patch(expense._id, beforeData as any);
      }
    } else if (log.type === "expense_delete" && log.before) {
      const { _id, _creationTime, ...beforeData } = log.before as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.insert("expenses", beforeData as any);
    } else if (log.type === "settlement_create" && log.targetId) {
      const settlement = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("_id"), log.targetId))
        .first();
      if (settlement) await ctx.db.delete(settlement._id);
    } else if (log.type === "settlement_delete" && log.before) {
      const { _id, _creationTime, ...beforeData } = log.before as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.db.insert("settlements", beforeData as any);
    }

    // Mark as undone
    await ctx.db.patch(args.logId, { undoneAt: Date.now() });
  },
});
