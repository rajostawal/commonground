import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getClerkId, requireHouseholdMember } from "./helpers";

const eventTypeValidator = v.union(
  v.literal("guest"),
  v.literal("party"),
  v.literal("quiet"),
  v.literal("maintenance"),
  v.literal("other")
);

export const createEvent = mutation({
  args: {
    householdId: v.id("households"),
    title: v.string(),
    type: eventTypeValidator,
    startDate: v.number(),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkId = await getClerkId(ctx);
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db.insert("events", {
      ...args,
      createdByUserId: clerkId,
      createdAt: Date.now(),
    });
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    type: v.optional(eventTypeValidator),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new ConvexError("Event not found");
    await requireHouseholdMember(ctx, event.householdId);

    const { eventId, ...updates } = args;
    await ctx.db.patch(eventId, updates);
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new ConvexError("Event not found");
    await requireHouseholdMember(ctx, event.householdId);
    await ctx.db.delete(args.eventId);
  },
});

export const listByHouseholdByMonth = query({
  args: {
    householdId: v.id("households"),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await requireHouseholdMember(ctx, args.householdId);

    return await ctx.db
      .query("events")
      .withIndex("byHouseholdIdByStartDate", (q) =>
        q
          .eq("householdId", args.householdId)
          .gte("startDate", args.startTimestamp)
          .lte("startDate", args.endTimestamp)
      )
      .collect();
  },
});

export const getById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    await requireHouseholdMember(ctx, event.householdId);
    return event;
  },
});
