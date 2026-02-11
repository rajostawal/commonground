import { type QueryCtx, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

/**
 * Throws if not authenticated. Returns the user record from our users table.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("byClerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new ConvexError("User not found — call upsertUser first");
  return user;
}

/**
 * Returns the Clerk userId from auth identity.
 */
export async function getClerkId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");
  return identity.subject;
}

/**
 * Verifies the user is a member of the given household.
 * Returns the membership record.
 */
export async function requireHouseholdMember(
  ctx: QueryCtx | MutationCtx,
  householdId: Id<"households">
) {
  const clerkId = await getClerkId(ctx);

  const membership = await ctx.db
    .query("memberships")
    .withIndex("byUserIdAndHouseholdId", (q) =>
      q.eq("userId", clerkId).eq("householdId", householdId)
    )
    .unique();

  if (!membership) throw new ConvexError("Not a member of this household");
  return membership;
}

/**
 * Gets the user's current household membership (first one found).
 */
export async function getMyMembership(ctx: QueryCtx | MutationCtx) {
  const clerkId = await getClerkId(ctx);

  return await ctx.db
    .query("memberships")
    .withIndex("byUserId", (q) => q.eq("userId", clerkId))
    .first();
}

/**
 * Generates a 6-character uppercase alphanumeric invite code.
 */
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
