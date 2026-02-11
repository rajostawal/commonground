# CommonGround — Product Requirements Document (PRD)

**Version:** 3.0  
**Last Updated:** February 2026  
**Status:** Active Development  
**Product Type:** Mobile-first household coordination platform (web + iOS-ready)

---

## 1. Executive Summary

CommonGround is a shared household operating system for roommates and co-living groups.  
It combines expense splitting, chores, calendar coordination, announcements, and house rules into one minimal dark-first product.

The goal is not “more features.”  
The goal is **less friction in shared living**.

CommonGround will launch with:

- Trustworthy expense splitting (Splitwise-level clarity)
- Household coordination (Notion-like structure and calm UI)
- Mobile-first UX, responsive web, future iOS app support
- Optional AI assists that reduce work but never override users

---

## 2. Competitive Research (Deep)

### 2.1 Splitwise — Key Learnings

Splitwise succeeds because it solves one problem extremely well:

> “Who owes whom, and how do we settle fairly without awkwardness?”

Key product strengths:

#### A. Wiki-style editing model
Splitwise allows any member to fix mistakes.  
This reduces friction because households behave like shared ledgers.

But it requires:

- Activity history
- Undo safety
- Clear attribution

#### B. Trust through math clarity
Splitwise never feels ambiguous:

- Balances always reconcile
- Splits are transparent
- Settlements simplify debt cleanly

#### C. Retention hooks
Splitwise retention comes from:

- Recurring bills (post-MVP for CommonGround)
- Reminders
- Frequent lightweight expense logging

#### D. Premium boundaries
Splitwise Pro monetizes:

- Receipt scanning/storage
- Advanced charts
- Currency conversion

This implies receipt storage is sensitive and should be opt-in.

---

### 2.2 Notion — Key Learnings

Notion succeeds because it feels:

- Calm
- Structured
- Minimal
- User-controlled

Key UI/UX takeaways:

#### A. Neutral-first design
Notion uses:

- Dark surfaces
- Low contrast borders
- Very restrained accent usage

#### B. Modular structure
Notion feels like blocks:

- Simple components
- Consistent spacing
- Predictable hierarchy

#### C. Information density without clutter
Notion supports deep content while staying clean.

CommonGround should apply this to:

- Expense lists
- Chore systems
- Rules and agreements

---

## 3. Product Vision

CommonGround exists to make shared living feel:

- Fair
- Clear
- Calm
- Organized

Instead of:

- Group chat chaos
- Forgotten debts
- Uneven chores
- Unspoken rules

---

## 4. Product Principles

### Non-negotiables

1. Mobile-first UX
2. Dark mode primary
3. Minimal color usage
4. Trustworthy expense math
5. Shared household = shared responsibility
6. AI assists are optional, reviewable, never automatic
7. Actions must always have visible paths (no swipe-only desktop UX)

---

## 5. Target Users

### Primary persona: Roommate household (ages 20–35)

Needs:

- Split groceries, rent, utilities
- Rotate chores fairly
- Coordinate schedules
- Reduce awkward conversations

---

## 6. Core Modules (MVP)

1. Authentication
2. Household onboarding
3. Home dashboard
4. Expenses + balances + settlements (no payment integrations)
5. Chores
6. Calendar
7. Rules + agreements
8. Announcements + chat
9. Members + settings

---

## 7. Permissions Model (Hybrid)

Decision: **Hybrid model**

- Any member can edit/delete expenses and settlements
- Changes are tracked with attribution
- Undo is available
- Owner can lock household later (future)

Reason:

- Splitwise proves wiki reduces friction
- Household coordination requires flexibility
- Safety comes from history, not restriction

Rules:

- Every money item stores:
  - createdBy
  - lastEditedBy
  - editedAt
- Delete requires confirmation
- Activity log shows all edits

---

## 8. Money System Requirements

### Storage

- All amounts stored as integer cents
- Multi-currency supported per expense
- Household default currency required

### Split Types

- Equal
- Percentage
- Exact
- Shares

### Deterministic rounding

Equal split:

- base = floor(total / n)
- remainder distributed in stable memberId order

### Debt simplification

- Greedy creditor/debtor matching
- Stable ordering
- Unit tested

---

## 9. AI Features (MVP-safe)

AI is optional and behind “AI Assist” toggle.

### AI Assist 1: Smart Split Suggestion (Ship in V1)

- Suggest split type and members
- User must click Apply

### AI Assist 2: Weekly Household Summary (Ship in V1)

- Generate recap from chores/events/expenses
- User posts as announcement

### AI Assist 3: Receipt Draft (Post-V1 or limited)

- Receipt upload is opt-in per expense
- Image not stored unless user confirms

---

## 10. UX + Visual Design

### Design goals

- Notion-like calm
- Cursor-inspired dark workspace feel
- No bright marketing colors

### Color system

- Background: near-black
- Surfaces: subtle elevation steps
- Accent: dark muted blue-gray (not neon)

Accent should feel like:

- Focus ring
- Primary CTA
- Selected nav

Not decoration.

### Typography

Google Fonts only:

- Inter
- JetBrains Mono

---

## 11. Navigation

### Mobile (<768px)

Bottom nav:

- Home
- Expenses
- Chores
- Calendar
- More

More hub:

- Chat
- Announcements
- Rules
- Members
- Settings

### Desktop

Sidebar nav with same structure.

---

## 12. Feature Specs (Detailed)

### 12.1 Home Dashboard

Must answer:

- What do I owe?
- What chores are mine?
- What’s next?

Cards:

- Balance summary
- My chores
- Upcoming events
- Recent expenses
- Latest announcement

---

### 12.2 Expenses

List view:

- Description
- Amount
- Paid by
- Date
- Row actions menu

Add expense:

- Amount
- Currency
- Paid by
- Split editor
- Optional receipt upload toggle

Settlement suggestions:

- Show who pays whom
- Record settlement event only
- No Venmo/PayPal integration in MVP

---

### 12.3 Chores

Chore creation:

- Frequency
- Rotation
- Members included

Completion:

- Mark done
- Optional photo proof

---

### 12.4 Calendar

Month grid + day list.

Event types:

- Guest
- Party
- Quiet
- Maintenance

---

### 12.5 Rules

Rules have:

- Category
- Priority
- Agreement tracking

Agree UI:

- Toggle or button
- Show % agreed

---

### 12.6 Chat + Announcements

Chat is real-time.

Announcements:

- Message type flag
- Separate feed
- Home preview

---

## 13. Technical Architecture

Frontend:

- Next.js App Router
- React + TypeScript
- Tailwind
- Radix UI primitives

Backend + DB:

- Convex (queries, mutations, realtime)

Auth:

- Clerk

AI:

- Gemini or Claude via server routes only

---

## 14. Release Plan

### V1 Demo success

- Two users join same household
- Expense added, balances update in real time
- Settlement suggestions appear
- Chores rotate correctly
- Calendar events visible
- Rules agreement works
- Announcements post successfully
- AI split suggestion shipped

---

## 15. Out of Scope

- Recurring expenses (post-MVP)
- Payment integrations
- Multi-household accounts
- Offline-first sync

---

## Appendix: Next Steps

After MVP:

- Recurring bills
- Premium receipt storage
- Analytics dashboards
- Household locking and roles
- Native iOS app wrapper

---
