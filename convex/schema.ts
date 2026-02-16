import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Users ─────────────────────────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    // Subscription fields (Polar)
    polarCustomerId: v.optional(v.string()),
    polarSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("past_due"),
        v.literal("none")
      )
    ),
    subscriptionCurrentPeriodEnd: v.optional(v.number()),
  })
    .index("byClerkId", ["clerkId"])
    .index("byEmail", ["email"]),

  // ── Households ─────────────────────────────────────────────────────────────
  households: defineTable({
    name: v.string(),
    inviteCode: v.string(),           // 6-char uppercase alphanumeric
    defaultCurrency: v.string(),       // ISO 4217, e.g. "USD"
    type: v.optional(v.union(
      v.literal("shared-flat"),
      v.literal("couple"),
      v.literal("family")
    )),
    photoUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    createdByUserId: v.string(),       // Clerk userId
    createdAt: v.number(),
  }).index("byInviteCode", ["inviteCode"]),

  // ── Memberships ───────────────────────────────────────────────────────────
  memberships: defineTable({
    userId: v.string(),               // Clerk userId
    householdId: v.id("households"),
    role: v.union(v.literal("owner"), v.literal("member")),
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byHouseholdId", ["householdId"])
    .index("byUserIdAndHouseholdId", ["userId", "householdId"]),

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: defineTable({
    householdId: v.id("households"),
    description: v.string(),
    amountCents: v.number(),           // integer cents
    currency: v.string(),              // ISO 4217
    paidByUserId: v.string(),          // Clerk userId
    splitType: v.union(
      v.literal("equal"),
      v.literal("percentage"),
      v.literal("exact"),
      v.literal("shares")
    ),
    splits: v.array(
      v.object({
        userId: v.string(),
        amountCents: v.number(),
        percentage: v.optional(v.number()),
        shares: v.optional(v.number()),
      })
    ),
    notes: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),  // Premium: receipt/photo
    createdByUserId: v.string(),
    createdAt: v.number(),
    lastEditedByUserId: v.optional(v.string()),
    lastEditedAt: v.optional(v.number()),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"]),

  // ── Settlements ───────────────────────────────────────────────────────────
  settlements: defineTable({
    householdId: v.id("households"),
    fromUserId: v.string(),
    toUserId: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    notes: v.optional(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
    lastEditedByUserId: v.optional(v.string()),
    lastEditedAt: v.optional(v.number()),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"]),

  // ── Chores ────────────────────────────────────────────────────────────────
  chores: defineTable({
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
    assignedMemberIds: v.array(v.string()),   // Clerk userIds
    currentAssigneeIdx: v.number(),           // for round-robin
    effortPoints: v.optional(v.number()),     // Premium: 1-10 scale
    createdByUserId: v.string(),
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"]),

  // ── Chore Completions ─────────────────────────────────────────────────────
  choreCompletions: defineTable({
    choreId: v.id("chores"),
    householdId: v.id("households"),
    completedByUserId: v.string(),
    completedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("byChoreId", ["choreId"])
    .index("byHouseholdId", ["householdId"]),

  // ── Events (Calendar) ─────────────────────────────────────────────────────
  events: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    type: v.union(
      v.literal("guest"),
      v.literal("party"),
      v.literal("quiet"),
      v.literal("maintenance"),
      v.literal("other")
    ),
    startDate: v.number(),             // Unix timestamp (ms)
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByStartDate", ["householdId", "startDate"]),

  // ── Messages (Chat + Announcements) ───────────────────────────────────────
  messages: defineTable({
    householdId: v.id("households"),
    authorUserId: v.string(),
    content: v.string(),
    isAnnouncement: v.boolean(),
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"]),

  // ── Shopping Lists ────────────────────────────────────────────────────────
  shoppingLists: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    createdByUserId: v.string(),
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"]),

  // ── Shopping Items ────────────────────────────────────────────────────────
  shoppingItems: defineTable({
    listId: v.id("shoppingLists"),
    householdId: v.id("households"),
    name: v.string(),
    quantity: v.optional(v.string()),           // Premium: e.g. "2 kg", "1 pack"
    category: v.optional(v.string()),           // e.g. "Dairy", "Produce"
    notes: v.optional(v.string()),              // Premium
    tags: v.optional(v.array(v.string())),      // Premium
    photoUrl: v.optional(v.string()),           // Premium: custom product photo
    boughtByUserId: v.optional(v.string()),
    boughtAt: v.optional(v.number()),
    createdByUserId: v.string(),
    createdAt: v.number(),
  })
    .index("byListId", ["listId"])
    .index("byHouseholdId", ["householdId"])
    .index("byListIdByCreatedAt", ["listId", "createdAt"]),

  // ── Contracts (Recurring Bills) ───────────────────────────────────────────
  contracts: defineTable({
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
    dueDay: v.optional(v.number()),       // 1-31
    notes: v.optional(v.string()),
    createdByUserId: v.string(),
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"]),

  // ── Activity Log ──────────────────────────────────────────────────────────
  activityLog: defineTable({
    householdId: v.id("households"),
    actorUserId: v.string(),
    type: v.union(
      v.literal("expense_create"),
      v.literal("expense_edit"),
      v.literal("expense_delete"),
      v.literal("settlement_create"),
      v.literal("settlement_delete"),
      v.literal("household_settings_change"),
      v.literal("member_join"),
      v.literal("member_leave"),
      v.literal("chore_complete"),
      v.literal("shopping_item_buy"),
      v.literal("contract_create")
    ),
    targetId: v.optional(v.string()),   // ID of affected record
    targetType: v.optional(v.string()), // "expense" | "settlement" | etc.
    targetDescription: v.optional(v.string()), // human-readable label
    before: v.optional(v.any()),        // snapshot before change (for undo)
    after: v.optional(v.any()),         // snapshot after change
    undoneAt: v.optional(v.number()),   // set when action is undone
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"])
    .index("byHouseholdIdByCreatedAt", ["householdId", "createdAt"])
    .index("byActorUserId", ["actorUserId"]),
});
