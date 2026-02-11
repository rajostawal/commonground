import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";
import { type Id } from "./_generated/dataModel";

const splitItemValidator = v.object({
  userId: v.string(),
  amountCents: v.number(),
  percentage: v.optional(v.number()),
  shares: v.optional(v.number()),
});

export const createExpense = mutation({
  args: {
    householdId: v.id("households"),
    description: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    paidByUserId: v.string(),
    splitType: v.union(
      v.literal("equal"),
      v.literal("percentage"),
      v.literal("exact"),
      v.literal("shares")
    ),
    splits: v.array(splitItemValidator),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    // Validate splits sum to amountCents
    const splitSum = args.splits.reduce((s, sp) => s + sp.amountCents, 0);
    if (splitSum !== args.amountCents) {
      throw new ConvexError(`Split sum (${splitSum}) does not equal total (${args.amountCents})`);
    }

    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      householdId: args.householdId,
      actorUserId: clerkId,
      type: "expense_create",
      targetId: expenseId,
      targetType: "expense",
      targetDescription: args.description,
      after: { ...args },
      createdAt: Date.now(),
    });

    return expenseId;
  },
});

export const updateExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
    description: v.optional(v.string()),
    amountCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    paidByUserId: v.optional(v.string()),
    splitType: v.optional(
      v.union(
        v.literal("equal"),
        v.literal("percentage"),
        v.literal("exact"),
        v.literal("shares")
      )
    ),
    splits: v.optional(v.array(splitItemValidator)),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new ConvexError("Expense not found");
    await requireHouseholdMember(ctx, expense.householdId);

    const { expenseId, ...updates } = args;
    const before = { ...expense };

    if (updates.splits && updates.amountCents) {
      const splitSum = updates.splits.reduce((s, sp) => s + sp.amountCents, 0);
      if (splitSum !== updates.amountCents) {
        throw new ConvexError(`Split sum (${splitSum}) does not equal total (${updates.amountCents})`);
      }
    }

    await ctx.db.patch(expenseId, {
      ...updates,
      lastEditedByUserId: clerkId,
      lastEditedAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      householdId: expense.householdId,
      actorUserId: clerkId,
      type: "expense_edit",
      targetId: expenseId,
      targetType: "expense",
      targetDescription: expense.description,
      before,
      after: { ...expense, ...updates },
      createdAt: Date.now(),
    });
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new ConvexError("Expense not found");
    await requireHouseholdMember(ctx, expense.householdId);

    const before = { ...expense };
    await ctx.db.delete(args.expenseId);

    await ctx.db.insert("activityLog", {
      householdId: expense.householdId,
      actorUserId: clerkId,
      type: "expense_delete",
      targetId: args.expenseId,
      targetType: "expense",
      targetDescription: expense.description,
      before,
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

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(args.limit ?? 100);

    return expenses;
  },
});

export const getById = query({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) return null;
    await requireHouseholdMember(ctx, expense.householdId);
    return expense;
  },
});
