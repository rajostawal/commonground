import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const createContract = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
    type: v.union(
      v.literal("rent"),
      v.literal("electricity"),
      v.literal("water"),
      v.literal("internet"),
      v.literal("insurance"),
      v.literal("streaming"),
      v.literal("other")
    ),
    amountCents: v.number(),
    currency: v.string(),
    frequency: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    dueDay: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    const contractId = await ctx.db.insert("contracts", {
      ...args,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      householdId: args.householdId,
      actorUserId: clerkId,
      type: "contract_create",
      targetId: contractId,
      targetType: "contract",
      targetDescription: args.name,
      createdAt: Date.now(),
    });

    return contractId;
  },
});

export const updateContract = mutation({
  args: {
    contractId: v.id("contracts"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("rent"),
        v.literal("electricity"),
        v.literal("water"),
        v.literal("internet"),
        v.literal("insurance"),
        v.literal("streaming"),
        v.literal("other")
      )
    ),
    amountCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    frequency: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly")
      )
    ),
    dueDay: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    await requireHouseholdMember(ctx, contract.householdId);

    const { contractId, ...updates } = args;
    await ctx.db.patch(contractId, updates);
  },
});

export const deleteContract = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) throw new ConvexError("Contract not found");
    await requireHouseholdMember(ctx, contract.householdId);

    await ctx.db.delete(args.contractId);
  },
});

export const listByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("contracts")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) return null;
    await requireHouseholdMember(ctx, contract.householdId);
    return contract;
  },
});
