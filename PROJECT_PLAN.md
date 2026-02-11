# CommonGround — Project Plan

**Version:** 1.0
**Created:** 2026-02-10
**Status:** Active
**Stack:** Next.js (App Router) + Convex + Clerk + Tailwind + Radix UI

---

## Overall Goal and Scope

Build CommonGround as a mobile-first household coordination web application with a clean, dark-first UI and Splitwise-level expense clarity. The product supports:

- Auth (Clerk)
- Household creation and joining via 6-char invite codes
- Home dashboard (balances, chores, events, announcements)
- Expenses with all 4 split types, balance tracking, debt simplification, settlement recording
- Chores with round-robin and fixed rotation
- Calendar month view + event CRUD
- Household rules with agreement tracking
- Chat and announcements (Convex realtime)
- Members and Settings
- Activity log + Undo (last 10 actions per user)
- Multi-currency per expense with household default
- Two AI assists: smart split suggestion + weekly summary (mock provider, opt-in)

**Out of scope for MVP:** recurring expenses, payment integrations, multi-household, offline sync, PWA, iOS native, receipt storage without explicit user action.

---

## Milestones and Phases

### Phase 0 — Documentation ✅
**Deliverables:** PROJECT_PLAN.md, TECH_DECISIONS.md, UX_SYSTEM.md
**DoD:** All three files written and committed

### Phase 1 — Repo Scaffold
**Deliverables:** Working Next.js app with all deps installed, Convex initialized, Clerk configured, TypeScript strict mode on
**DoD:** `npm run dev` starts without errors; `npm run build` passes

### Checklist:
- [ ] `create-next-app` with App Router, TypeScript, Tailwind, src/
- [ ] Install: convex, @clerk/nextjs, Radix UI packages, lucide-react, clsx, tailwind-merge, class-variance-authority, date-fns
- [ ] Install dev: vitest, @vitejs/plugin-react, @testing-library/react, jsdom
- [ ] `.env.local` with all required keys (Convex, Clerk, AI flags)
- [ ] `vitest.config.ts` configured
- [ ] `tsconfig.json` strict mode confirmed

---

### Phase 2 — Design System + Base Layout
**Deliverables:** Tailwind token config, globals.css, AppShell, BottomNav, Sidebar, all UI primitives
**DoD:** Design system renders correctly at 375px (mobile) and 1280px (desktop)

### Checklist:
- [ ] `tailwind.config.ts` with bg, border, text, accent, semantic tokens
- [ ] `globals.css` with CSS variables, Inter + JetBrains Mono fonts, focus ring, scrollbar
- [ ] `AppShell.tsx` — switches between mobile/desktop layout
- [ ] `BottomNav.tsx` — 5 tabs, active state, mobile only
- [ ] `Sidebar.tsx` — desktop left sidebar, same 5 items
- [ ] UI primitives: Button, Card, Dialog, Sheet, Toast, FormField, Avatar, Badge, Skeleton, EmptyState, ConfirmDialog

---

### Phase 3 — Auth + Onboarding + Gating
**Deliverables:** Sign in/up/reset pages, onboarding create/join household, Clerk middleware, route gating
**DoD:** Full auth flow works; unauthed users hit sign-in; authed users without household hit onboarding; authed + household users see app

### Checklist:
- [ ] `src/middleware.ts` — Clerk auth middleware
- [ ] Auth pages: sign-in, sign-up, forgot-password
- [ ] Onboarding index (create or join choice)
- [ ] Create household form (name, default currency)
- [ ] Join household form (invite code)
- [ ] Convex: upsertUser, createHousehold, joinByInviteCode (idempotent), getMyHousehold
- [ ] Convex: memberships table + queries
- [ ] Route gating in layout or server components

---

### Phase 4 — Money Math Library + Tests
**Deliverables:** splitCalculator, balanceCalculator, debtSimplifier with Vitest tests all passing
**DoD:** `npx vitest run` — all tests green. Edge cases covered for all 4 split types and debt simplifier.

### Checklist:
- [ ] `src/lib/money/splitCalculator.ts` — equal, percentage, exact, shares with deterministic rounding
- [ ] `src/lib/money/balanceCalculator.ts` — net balance per member
- [ ] `src/lib/money/debtSimplifier.ts` — greedy creditor/debtor matching
- [ ] `src/lib/money/formatters.ts` — formatCurrency, formatDate
- [ ] `src/lib/money/__tests__/splitCalculator.test.ts` — all split types + edge cases
- [ ] `src/lib/money/__tests__/balanceCalculator.test.ts`
- [ ] `src/lib/money/__tests__/debtSimplifier.test.ts` — multiple scenarios + tie-breaking

---

### Phase 5 — Expenses End-to-End
**Deliverables:** Full expenses feature: list, add (with split editor), detail, edit, delete, balance breakdown, suggested settlements, record settlement, activity log entries, undo
**DoD:** Two users can add expenses, see correct balances, see settlement suggestions, record settlement, undo last action

### Checklist:
- [ ] Convex schema: expenses, settlements, activityLog tables with all indexes
- [ ] Convex: createExpense, updateExpense, deleteExpense, listByHousehold, getById
- [ ] Convex: createSettlement, deleteSettlement, listByHousehold
- [ ] Convex: logAction, getUndoableActions, undoAction
- [ ] `SplitEditor.tsx` — 4 split types, live validation, rounding preview
- [ ] `AISplitSuggestion.tsx` — suggestion card behind AI flag
- [ ] Expenses list page
- [ ] Add expense page (full-screen form)
- [ ] Expense detail + edit page
- [ ] Delete with confirm dialog
- [ ] Balance breakdown section
- [ ] Suggested settlements (from debtSimplifier)
- [ ] Record settlement form
- [ ] Settlement history list
- [ ] `UndoBanner.tsx` after edit/delete
- [ ] Activity log entries for all expense + settlement actions

---

### Phase 6 — Chores End-to-End
**Deliverables:** Chore list, add, detail, completion flow, rotation logic
**DoD:** Chore creation with round-robin rotation; completing a chore advances to next assignee deterministically

### Checklist:
- [ ] Convex schema: chores, choreCompletions
- [ ] Convex: createChore, updateChore, deleteChore, completeChore, listByHousehold
- [ ] `choreRotation.ts` utility (deterministic)
- [ ] Chores list page (All / Mine tabs)
- [ ] Add chore page
- [ ] Chore detail page
- [ ] Completion sheet/dialog
- [ ] Activity log entries for completions

---

### Phase 7 — Calendar End-to-End
**Deliverables:** Month grid, day event list, add/edit/delete events
**DoD:** Events appear on correct days; month navigation works; 4 event types display distinctly

### Checklist:
- [ ] Convex schema: events
- [ ] Convex: createEvent, updateEvent, deleteEvent, listByHouseholdByMonth
- [ ] Calendar page with month grid
- [ ] Day event list panel
- [ ] Add event page
- [ ] Event detail + edit page
- [ ] Delete with confirm

---

### Phase 8 — Rules End-to-End
**Deliverables:** Rules list (by category), add, detail, agree toggle, agreement %
**DoD:** Rule created; members can agree; % agreed updates in real-time

### Checklist:
- [ ] Convex schema: rules
- [ ] Convex: createRule, updateRule, deleteRule, toggleAgree, listByHousehold
- [ ] Rules list page (grouped by category)
- [ ] Add rule page
- [ ] Rule detail page
- [ ] Agree toggle UI
- [ ] Agreement progress bar

---

### Phase 9 — Chat + Announcements
**Deliverables:** Real-time chat, announcement type messages, announcements feed
**DoD:** Two users can chat in real-time; announcements appear in both chat and announcements feed

### Checklist:
- [ ] Convex schema: messages
- [ ] Convex: sendMessage, listByHousehold, listAnnouncements
- [ ] Chat page (real-time via Convex useQuery)
- [ ] Announcements feed page
- [ ] AI weekly summary → draft → post as announcement flow
- [ ] Home preview of latest announcement

---

### Phase 10 — Activity Log + Undo
**Deliverables:** Activity timeline page, undo for last 10 actions per user
**DoD:** All create/edit/delete actions appear in log; undo reverses last actions; undone state can't be re-undone

### Checklist:
- [ ] Activity log full timeline page
- [ ] `ActivityItem.tsx` with actor, action, target, timestamp
- [ ] Undo CTA on eligible actions (not yet undone, within last 10)
- [ ] `undoAction` Convex mutation (atomic, ownership-checked)
- [ ] UndoBanner integrates with undo action

---

### Phase 11 — AI Assists + Mock Provider
**Deliverables:** Mock provider (works with no API keys), Gemini provider, Claude provider, split suggestion card, weekly summary flow
**DoD:** With AI toggle off, no errors anywhere; with mock provider, split suggestion and summary both work

### Checklist:
- [ ] `src/lib/ai/provider.ts` — abstract interface
- [ ] `src/lib/ai/mockProvider.ts` — deterministic mock responses
- [ ] `src/lib/ai/geminiProvider.ts` — real Gemini via server route
- [ ] `src/lib/ai/claudeProvider.ts` — Claude API via server route
- [ ] `src/app/api/ai/suggest-split/route.ts`
- [ ] `src/app/api/ai/weekly-summary/route.ts`
- [ ] AI toggle in Settings (persisted in Convex users table)
- [ ] `AISplitSuggestion.tsx` in Add Expense flow
- [ ] Weekly summary button on Home with draft/edit/post flow

---

### Phase 12 — Home Dashboard
**Deliverables:** Complete home screen with all preview cards
**DoD:** All 5 home cards render; balance summary is correct; AI summary button visible (if AI enabled)

### Checklist:
- [ ] Balance summary card (you owe / owed to you)
- [ ] My chores preview (next 3 due)
- [ ] Upcoming events preview
- [ ] Recent expenses preview
- [ ] Latest announcement preview
- [ ] AI weekly summary button

---

### Phase 13 — Members + Settings
**Deliverables:** Members list, invite code card, leave household, Settings page
**DoD:** Members list shows all household members; invite code can be copied; currency can be changed by any member

### Checklist:
- [ ] Members page (list + roles)
- [ ] Invite code card with copy action + toast
- [ ] Leave household flow with confirm
- [ ] Settings page: AI toggle, default currency change, sign out
- [ ] Profile page

---

### Phase 14 — Polish + Accessibility
**Deliverables:** All skeleton states, empty states, focus rings, keyboard nav, mobile 375px pass
**DoD:** No dead UI; all interactive elements have aria labels; keyboard nav works on desktop lists; 375px clean with no horizontal scroll

### Checklist:
- [ ] Skeleton loading on all list pages
- [ ] Empty states on all list pages
- [ ] Focus ring visible on all focusable elements
- [ ] aria-label on icon-only buttons
- [ ] Keyboard navigation for data tables / lists
- [ ] Mobile 375px audit (every screen)
- [ ] Desktop 1280px audit (sidebar doesn't look stretched)
- [ ] All toasts working
- [ ] All confirm dialogs working

---

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Money math rounding bugs | Unit tests required before any UI; deterministic algorithm documented |
| Convex schema changes breaking existing data | Use schema versioning; test migrations before shipping |
| Undo logic causing data inconsistency | Undo mutation is atomic in Convex; ownership + limit (10) validated server-side |
| Clerk + Convex identity sync | upsertUser mutation called on every sign-in; Convex userId = Clerk userId |
| Realtime performance with large message history | Convex queries paginated; messages list limited to recent 100 |
| AI keys not available | Mock provider always works; AI features guarded by `NEXT_PUBLIC_AI_ENABLED` flag |
| Invite code collisions | Generate with crypto.randomBytes; check uniqueness before insert; 36^6 = 2.17B combinations |

---

## Open Questions

_None — all decisions made. See TECH_DECISIONS.md._

---

## Progress Log

### 2026-02-10 — Session 1
- PRD v3.0 reviewed
- PROJECT_PLAN.md, TECH_DECISIONS.md, UX_SYSTEM.md created
- Phase 1 complete: Next.js 16 scaffold + all dependencies installed
- Phase 2 complete: Tailwind v4 design tokens (CSS @theme), globals.css, root layout, all UI primitives (Button, Card, Dialog, Sheet, Toast, FormField, Select, Avatar, Badge, Skeleton, EmptyState, ConfirmDialog), AppShell, BottomNav, Sidebar
- Phase 3 complete: Clerk middleware, auth pages, onboarding pages, app gating in layout
- Phase 4 complete: Money math library — splitCalculator, balanceCalculator, debtSimplifier, formatters — 33 Vitest tests ALL PASSING
- Phase 5 complete: Expenses end-to-end — Convex schema + all backend functions, add/list/detail/edit/delete, SplitEditor (4 types), AI split suggestion, settlements (suggestions + recording + history), activity logging
- Phase 6 complete: Chores — list/add/detail, completion flow, round-robin rotation
- Phase 7 complete: Calendar — month grid, day events, add/edit/delete
- Phase 8 complete: Rules — grouped by category, add/detail, agree toggle, agreement bar
- Phase 9 complete: Chat (realtime) + Announcements feed + AI summary sheet
- Phase 10 complete: Activity log timeline page with undo buttons
- Phase 11 complete: AI mock provider + Gemini/Claude server routes + suggest-split + weekly-summary
- Phase 12 complete: Home dashboard with balance, chores, events, expenses, announcement cards + activity link
- Phase 13 complete: Members (invite code + leave), Settings (currency + AI toggle + sign out), Profile
- Phase 14 complete: Accessibility audit — all aria-labels present, ConfirmDialog on all destructive actions, Skeleton loading on all lists, EmptyState on all lists, focus rings configured

### Status: ALL PHASES COMPLETE

---

## How to Resume

1. Read this file (`PROJECT_PLAN.md`) to find the last completed phase
2. Read `TECH_DECISIONS.md` for architectural context
3. Read `UX_SYSTEM.md` for design token usage
4. Check git log for last commit to understand exact state
5. Run `npm run dev` to verify app starts
6. Run `npx vitest run` to verify tests pass
7. Resume at first unchecked item in the relevant phase checklist
8. Update Progress Log at top of session and at session end

**Next session starting point:** Look for the last `[ ]` item in the checklist above and continue from there.
