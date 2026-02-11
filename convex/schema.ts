import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Users ─────────────────────────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    aiEnabled: v.boolean(),
    createdAt: v.number(),
  })
    .index("byClerkId", ["clerkId"])
    .index("byEmail", ["email"]),

  // ── Households ─────────────────────────────────────────────────────────────
  households: defineTable({
    name: v.string(),
    inviteCode: v.string(),           // 6-char uppercase alphanumeric
    defaultCurrency: v.string(),       // ISO 4217, e.g. "USD"
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

  // ── Rules ─────────────────────────────────────────────────────────────────
  rules: defineTable({
    householdId: v.id("households"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),              // e.g. "cleaning", "guests", "noise"
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    agreedByUserIds: v.array(v.string()),
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
      v.literal("rule_agree")
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

  // ── AI Artifacts (optional, for prompts/outputs) ──────────────────────────
  aiArtifacts: defineTable({
    householdId: v.id("households"),
    userId: v.string(),
    type: v.union(v.literal("split_suggestion"), v.literal("weekly_summary")),
    prompt: v.optional(v.string()),
    output: v.string(),
    accepted: v.boolean(),
    createdAt: v.number(),
  })
    .index("byHouseholdId", ["householdId"]),
});
