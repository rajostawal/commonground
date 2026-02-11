import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

export const createSettlement = mutation({
  args: {
    householdId: v.id("households"),
    fromUserId: v.string(),
    toUserId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    const settlementId = await ctx.db.insert("settlements", {
      ...args,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      householdId: args.householdId,
      actorUserId: clerkId,
      type: "settlement_create",
      targetId: settlementId,
      targetType: "settlement",
      targetDescription: `Settlement: ${args.amountCents / 100} ${args.currency}`,
      after: { ...args },
      createdAt: Date.now(),
    });

    return settlementId;
  },
});

export const deleteSettlement = mutation({
  args: { settlementId: v.id("settlements") },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    const settlement = await ctx.db.get(args.settlementId);
    if (!settlement) throw new ConvexError("Settlement not found");
    await requireHouseholdMember(ctx, settlement.householdId);

    const before = { ...settlement };
    await ctx.db.delete(args.settlementId);

    await ctx.db.insert("activityLog", {
      householdId: settlement.householdId,
      actorUserId: clerkId,
      type: "settlement_delete",
      targetId: args.settlementId,
      targetType: "settlement",
      targetDescription: `Settlement: ${settlement.amountCents / 100} ${settlement.currency}`,
      before,
      createdAt: Date.now(),
    });
  },
});

export const listByHousehold = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("settlements")
      .withIndex("byHouseholdIdByCreatedAt", (q) =>
        q.eq("householdId", args.householdId)
      )
      .order("desc")
      .take(100);
  },
});
