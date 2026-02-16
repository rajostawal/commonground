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
    tags: v.optional(v.array(v.string())),
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
      tags: args.tags,
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
    tags: v.optional(v.array(v.string())),
    photoUrl: v.optional(v.string()),
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
      await ctx.db.patch(args.itemId, {
        boughtByUserId: undefined,
        boughtAt: undefined,
      });
    } else {
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

export const getById = query({
  args: { itemId: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;
    await requireHouseholdMember(ctx, item.householdId);
    return item;
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

/** Return unique item names previously bought in this household (for quick re-add chips). */
export const recentlyUsedNames = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("byHouseholdId", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(200);

    // Unique names of bought items, most recent first
    const seen = new Set<string>();
    const result: { name: string; category?: string }[] = [];
    for (const item of items) {
      if (item.boughtByUserId && !seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        result.push({ name: item.name, category: item.category });
      }
    }
    return result.slice(0, 20);
  },
});
