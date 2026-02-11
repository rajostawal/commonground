# CommonGround — Technical Decisions

**Created:** 2026-02-10
**Author:** Engineering
**Purpose:** Record architectural decisions and rationale to avoid re-litigating choices each session

---

## Frontend Framework

**Decision:** Next.js 15 with App Router
**Rationale:** App Router enables server components for faster initial loads, built-in layouts match our shell-based nav, and it has first-class TypeScript support. Pages Router is legacy.
**Implication:** Use `"use client"` only where needed (interactive components, hooks). Keep server components for data fetching pages.

---

## Backend + Database

**Decision:** Convex
**Rationale:** Provides realtime subscriptions (needed for chat), type-safe queries/mutations, serverless execution, and built-in auth integration with Clerk. Replaces Firebase from earlier prototype.
**Implication:** All backend logic in `convex/` directory. No API routes for data — Convex mutations/queries only. API routes only for AI (server-side only).

---

## Authentication

**Decision:** Clerk (email + password only for MVP)
**Rationale:** Turnkey auth with Convex integration, handles sessions/JWTs, email verification, password reset out of the box.
**Implication:** Clerk `userId` is the canonical identity. Every Convex mutation must verify `auth.getUserIdentity()`. User record created in `users` table on first sign-in via `upsertUser` mutation.

---

## Money Storage

**Decision:** Integer cents (e.g., $12.50 → 1250)
**Rationale:** Floating point arithmetic on decimals causes rounding errors that compound over time. Cents are exact integers.
**Implication:** All `amountCents` fields are `v.number()` integers. UI formats to display currency. Never store floats for money.

---

## Split Rounding Algorithm

**Decision:** Deterministic rounding with stable memberId ordering

Equal split:
```
base = floor(totalCents / n)
remainder = totalCents % n
Members sorted by memberId (lexicographic)
First `remainder` members receive base + 1
Remaining members receive base
```

Percentage split:
```
rawAllocations = members.map(m => totalCents * m.percentage / 100)
floored = rawAllocations.map(Math.floor)
remaining = totalCents - sum(floored)
Sort members by (rawAllocation - floor, then memberId desc for tie-break)
Top `remaining` members get +1 cent
```

Shares split: Convert shares to percentages, then use percentage algorithm.

**Rationale:** Deterministic means any user computing balances gets the same answer. Stable ordering prevents drift.

---

## Debt Simplification

**Decision:** Greedy creditor/debtor matching
```
1. Compute net balance per member (positive = creditor, negative = debtor)
2. Sort creditors descending by amount, then memberId for tie-break
3. Sort debtors ascending (most negative first), then memberId for tie-break
4. Greedy: match largest creditor with largest debtor
5. Settle min(credit, abs(debt))
6. Remove settled party, continue
```

**Rationale:** Minimizes number of transactions. Deterministic with stable ordering. Matches Splitwise behavior.

---

## Undo Policy

**Decision:** Last 10 actions per user (not time-based)
**Rationale:** Time-based undo (10 minutes) creates race conditions with realtime updates and is harder to reason about. Count-based is deterministic.

**Implementation:**
- `activityLog` stores `{ userId, householdId, type, before, after, undoneAt?, createdAt }`
- `getUndoableActions(userId)`: returns actions where `undoneAt == null`, ordered by `createdAt desc`, limit 10
- `undoAction(logId)`: validates user owns the action, action is not already undone, action type is undoable (expense edit/delete, settlement edit/delete). Atomically restores `before` state and sets `undoneAt`.

**Undoable action types:** `expense_create`, `expense_edit`, `expense_delete`, `settlement_create`, `settlement_delete`
**Non-undoable:** `household_settings_change` (too risky with multi-user), `member_join`, `member_leave`

---

## AI Provider Architecture

**Decision:** Abstract interface with mock + real providers, server-route only
```
interface AiProvider {
  suggestSplit(description: string, amount: number, members: Member[]): Promise<SplitSuggestion>
  generateWeeklySummary(data: HouseholdData): Promise<string>
}
```

**Providers:**
- `MockAiProvider` — returns canned/deterministic responses, no API keys needed
- `GeminiAiProvider` — calls Google Gemini API from server route
- `ClaudeAiProvider` — calls Anthropic API from server route

**Selection:** `NEXT_PUBLIC_AI_PROVIDER=mock|gemini|claude` env var
**Feature flag:** `NEXT_PUBLIC_AI_ENABLED=true|false` — if false, AI components hide silently, no errors
**Per-user toggle:** Stored in `users.aiEnabled` field in Convex

**AI routes are server-only** (`src/app/api/ai/*/route.ts`). Never call AI from browser.

---

## Invite Code Format

**Decision:** 6-character uppercase alphanumeric (A–Z, 0–9), generated server-side
**Character set:** 36 characters (26 letters + 10 digits) → 36^6 = 2,176,782,336 combinations
**Generation:** `crypto.randomUUID()` or `Math.random()` with rejection sampling if collision
**Display:** Rendered in JetBrains Mono font, spaced for readability
**Validation:** Case-insensitive input (normalize to uppercase before lookup)
**Join flow:** Server-side only. Lookup by inviteCode index → validate code active → create membership atomically → idempotent (return success if already a member)

---

## Single Household Per User (MVP)

**Decision:** Each user belongs to exactly one active household in MVP
**Rationale:** Simplifies routing (no household selector needed), reduces cognitive overhead
**Implication:** `getMyHousehold` returns single household or null. Multi-household is post-MVP.

---

## Navigation Structure

**Mobile (< 768px):** Bottom navigation bar
```
[Home] [Expenses] [Chores] [Calendar] [More]
```
"More" opens a hub page with: Chat, Announcements, Rules, Members, Settings, Profile

**Desktop (≥ 1024px):** Left sidebar
```
Home
Expenses
Chores
Calendar
─────
More ▸
  Chat
  Announcements
  Rules
  Members
  Settings
  Profile
```

**Routing:**
- `(auth)` group — sign-in, sign-up, forgot-password
- `(onboarding)` group — create/join household
- `(app)` group — all authenticated app routes

---

## Currency Handling

**Decision:** Multi-currency per expense, household has a default currency that any member can change
**Storage:** `currency` field on each expense (ISO 4217 code, e.g., "USD", "EUR", "GBP")
**Household default:** Stored in `households.defaultCurrency`
**Balances:** Computed per-currency independently — no FX conversion in MVP
**Display:** Currency amounts always shown with their code (USD 12.50, EUR 8.00)

---

## TypeScript Configuration

**Decision:** Strict mode enabled
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```
**No `any` types** in core models. Use `unknown` + type guards where necessary.

---

## Testing

**Decision:** Vitest (not Jest)
**Rationale:** Faster, native ESM support, compatible with Next.js App Router
**Test files:** `src/lib/money/__tests__/` for money math
**Coverage requirement:** All 4 split types, all debt simplifier scenarios, edge cases (1 person, 0 remainder, etc.)

---

## Realtime

**Decision:** Convex native realtime via `useQuery` hooks
**Rationale:** Convex queries are live by default — no WebSocket boilerplate needed
**Chat:** Messages table subscribed in chat page; renders new messages automatically
**Balances:** Expense/settlement queries are live — balances update when anyone adds/edits

---

## Error Handling Strategy

- Convex mutations throw `ConvexError` for user-facing errors (not found, not member, validation)
- Client catches and shows toast error
- Loading states: `isLoading` flag from Convex query → show `<Skeleton />`
- Network errors: generic error toast with "Try again" option
- AI errors: silently hide AI card, log to console, never show error spam to user

---

## Accessibility Baseline

- All interactive elements keyboard-accessible
- Icon-only buttons have `aria-label`
- Form inputs have associated labels
- Focus ring visible on all focusable elements (ring using `accent.focus` token)
- Color is never the only way to convey information (semantic icons + text alongside color)
- Radix UI primitives handle ARIA roles, keyboard nav, and focus management

---

## Design Decisions

- **Dark-first**: Background is near-black (#0a0a0a equivalent). No white background option.
- **Accent**: Muted dark blue-gray (NOT neon, NOT vibrant). Used ONLY for: primary CTA, focus ring, selected nav, links.
- **No random hex in components**: All colors use Tailwind token classes.
- **JetBrains Mono**: Used for invite codes, monetary amounts in transaction lists, IDs, and code-like labels.
- **Spacing**: 4px base (Tailwind default). Dense enough to be useful — no excessive padding.
