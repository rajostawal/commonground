import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const createList = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db.insert("shoppingLists", {
      householdId: args.householdId,
      name: args.name,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });
  },
});

export const updateList = mutation({
  args: {
    listId: v.id("shoppingLists"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new ConvexError("Shopping list not found");
    await requireHouseholdMember(ctx, list.householdId);

    await ctx.db.patch(args.listId, { name: args.name });
  },
});

export const deleteList = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) throw new ConvexError("Shopping list not found");
    await requireHouseholdMember(ctx, list.householdId);

    // Delete all items in this list
    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("byListId", (q) => q.eq("listId", args.listId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.listId);
  },
});

export const listByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("shoppingLists")
      .withIndex("byHouseholdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return null;
    await requireHouseholdMember(ctx, list.householdId);
    return list;
  },
});

export const getOrCreateDefault = mutation({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    const existing = await ctx.db
      .query("shoppingLists")
      .withIndex("byHouseholdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("shoppingLists", {
      householdId: args.householdId,
      name: "Shopping List",
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });
  },
});
