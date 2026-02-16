import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const createItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    name: v.string(),
    quantity: v.optional(v.string()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const list = await ctx.db.get(args.listId);
    if (!list) throw new ConvexError("Shopping list not found");
    await requireHouseholdMember(ctx, list.householdId);

    return await ctx.db.insert("shoppingItems", {
      listId: args.listId,
      householdId: list.householdId,
      name: args.name,
      quantity: args.quantity,
      category: args.category,
      notes: args.notes,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });
  },
});

export const updateItem = mutation({
  args: {
    itemId: v.id("shoppingItems"),
    name: v.optional(v.string()),
    quantity: v.optional(v.string()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new ConvexError("Shopping item not found");
    await requireHouseholdMember(ctx, item.householdId);

    const { itemId, ...updates } = args;
    await ctx.db.patch(itemId, updates);
  },
});

export const toggleBought = mutation({
  args: { itemId: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new ConvexError("Shopping item not found");
    await requireHouseholdMember(ctx, item.householdId);

    if (item.boughtByUserId) {
      // Unmark as bought
      await ctx.db.patch(args.itemId, {
        boughtByUserId: undefined,
        boughtAt: undefined,
      });
    } else {
      // Mark as bought
      await ctx.db.patch(args.itemId, {
        boughtByUserId: clerkId,
        boughtAt: Date.now(),
      });

      await ctx.db.insert("activityLog", {
        householdId: item.householdId,
        actorUserId: clerkId,
        type: "shopping_item_buy",
        targetId: args.itemId,
        targetType: "shopping_item",
        targetDescription: item.name,
        createdAt: Date.now(),
      });
    }
  },
});

export const deleteItem = mutation({
  args: { itemId: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new ConvexError("Shopping item not found");
    await requireHouseholdMember(ctx, item.householdId);

    await ctx.db.delete(args.itemId);
  },
});

export const listByList = query({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) return [];
    await requireHouseholdMember(ctx, list.householdId);

    return await ctx.db
      .query("shoppingItems")
      .withIndex("byListIdByCreatedAt", (q) =>
        q.eq("listId", args.listId)
      )
      .order("desc")
      .collect();
  },
});
