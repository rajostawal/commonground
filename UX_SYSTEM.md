# CommonGround — UX System

**Created:** 2026-02-10
**Purpose:** Design token specification, typography rules, layout patterns, and component guidelines for all contributors

---

## Design Philosophy

CommonGround should feel **calm, trustworthy, and precise** — like a well-organized shared ledger, not a social app.

Inspiration:
- **Notion**: neutral surfaces, modular structure, restrained accent use
- **Cursor**: dark workspace, muted accents, density without clutter
- **Linear**: purposeful motion, no decoration, crisp type

Anti-patterns to avoid:
- Bright marketing colors
- Excessive empty space ("airy" padding)
- Neon or vibrant accents
- Decorative illustrations or icons
- Swipe-only actions (no swipe-required gestures on desktop)

---

## Color System

### Background Layers (dark surface elevation)

```
bg-base       #0a0a0a   — outermost background, page background
bg-surface-1  #111111   — primary surface (cards, panels)
bg-surface-2  #1a1a1a   — elevated surface (dropdowns, popovers)
bg-surface-3  #222222   — further elevated (modals, tooltips)
bg-overlay    rgba(0,0,0,0.6) — dialog/sheet backdrop
```

### Border

```
border-subtle  rgba(255,255,255,0.06)  — subtle separator, card border
border-default rgba(255,255,255,0.10) — standard border
border-strong  rgba(255,255,255,0.16) — emphasized border (inputs focus ring base)
```

### Text

```
text-primary   #f2f2f2  — headlines, primary content
text-secondary #a0a0a0  — secondary labels, metadata
text-muted     #666666  — placeholder text, disabled labels
text-disabled  #444444  — truly disabled state
```

### Accent (muted dark blue-gray)

```
accent          #5b7fa6  — primary CTA background, selected nav indicator
accent-hover    #6b8fb6  — hover state
accent-focus    #5b7fa6  — focus ring color
accent-muted    rgba(91,127,166,0.12) — subtle accent tint (selected row bg, chip)
```

**Rules for accent usage:**
- ✅ Primary button background
- ✅ Active/selected bottom nav item + sidebar item
- ✅ Focus ring on all focusable elements
- ✅ Links (text color)
- ✅ Checkmarks, toggles (on state)
- ❌ Backgrounds, cards, headers
- ❌ Decorative use
- ❌ Multiple accent-colored elements competing

### Semantic Colors (validation + toasts only)

```
semantic-success  #2d6a4f / bg: #0d2818  — green for positive
semantic-warning  #b5770d / bg: #2d1f04  — amber for caution
semantic-error    #c0392b / bg: #2d0d0a  — red for destructive/error
semantic-info     #2563eb / bg: #0d1a2d  — blue for informational
```

**Rules:**
- ❌ Never use semantic colors for decoration
- ✅ Form validation errors
- ✅ Toast messages
- ✅ Status badges (overdue chore = warning, balance owed = info)

---

## Typography

### Font Families

```css
font-sans: 'Inter', system-ui, sans-serif       /* UI text */
font-mono: 'JetBrains Mono', monospace          /* Codes, amounts, IDs */
```

### Type Scale

```
text-xs     12px / 1.5  — metadata, badges, timestamps
text-sm     14px / 1.5  — secondary text, form labels, list items
text-base   16px / 1.6  — body text, primary list content
text-lg     18px / 1.4  — section headings, card titles
text-xl     20px / 1.3  — page headings (mobile)
text-2xl    24px / 1.2  — page headings (desktop)
text-3xl    30px / 1.1  — hero numbers (balance amounts)
```

### Font Weight

```
font-normal  400  — body text
font-medium  500  — labels, secondary headings
font-semibold 600 — headings, card titles
font-bold    700  — hero numbers, emphasis
```

### JetBrains Mono usage

Use `font-mono` for:
- Invite codes: `ABCXYZ`
- Expense amounts in transaction lists: `$12.50`
- Balance amounts: `$47.00`
- Member IDs where exposed
- Any code-like label

---

## Spacing Scale

Tailwind default 4px base. Our usage conventions:

```
Space-0.5   2px   — micro gaps (between icon + label)
Space-1     4px   — tight internal padding
Space-1.5   6px   — badge internal padding
Space-2     8px   — compact item padding, list gaps
Space-3     12px  — card internal padding (mobile)
Space-4     16px  — standard padding, card gaps
Space-5     20px  — section gaps
Space-6     24px  — card padding (desktop), major section gaps
Space-8     32px  — page margins (desktop)
Space-12    48px  — hero section spacing
```

### Layout Padding

```
Mobile page padding:   px-4 (16px)
Desktop page padding:  px-8 (32px)
Card padding:          p-3 (mobile) / p-4 (desktop)
Form section gaps:     space-y-4
List item gaps:        space-y-2
```

---

## Navigation Patterns

### Mobile Bottom Nav (< 768px)

```
┌─────────────────────────────────────────┐
│                 Content                 │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🏠    💰    ✓    📅    ···             │
│ Home  Exp  Chores  Cal  More            │
└─────────────────────────────────────────┘
```

- Height: 60px + safe area inset
- Active state: accent-colored icon + label + subtle accent-muted underline
- Inactive: text-muted icon + label
- No badge in MVP (post-MVP: notification count)

### Desktop Sidebar (≥ 1024px)

```
┌──────────┬──────────────────────────────┐
│ Logo     │                              │
│──────────│         Content              │
│ Home     │                              │
│ Expenses │                              │
│ Chores   │                              │
│ Calendar │                              │
│──────────│                              │
│ ▸ More   │                              │
│  Chat    │                              │
│  Announce│                              │
│  Rules   │                              │
│  Members │                              │
│  Settings│                              │
│  Profile │                              │
└──────────┴──────────────────────────────┘
```

- Sidebar width: 240px (fixed, not collapsible in MVP)
- Active item: accent text + accent-muted background
- Section divider between main nav and More items
- "More" acts as a collapsible group header (default expanded)

---

## Component Guidelines

### Button

Variants:
- `primary` — accent background, white text, used for primary CTA (one per screen)
- `secondary` — surface-2 background, text-primary, used for secondary actions
- `ghost` — transparent, text-secondary, used for tertiary actions
- `destructive` — semantic-error color, used for delete/leave actions

Sizes: `sm` (32px), `md` (40px), `lg` (48px)

Rules:
- Only ONE primary button per screen on mobile
- Destructive buttons never appear as primary CTA without user intent
- Icon-only buttons must have `aria-label`
- Loading state: show spinner, disable click

### Card

```
bg-surface-1 rounded-lg border border-subtle p-4
```

- Hover state (interactive cards): `border-default` + subtle brightness
- No card-within-card except for summaries

### FormField

```
<FormField label="Amount" error="Required">
  <input ... />
</FormField>
```

- Label above input (not floating placeholder)
- Error message below input in `text-semantic-error`
- Disabled state: `text-muted` + `opacity-50`
- Required indicator: `*` in label

### Dialog (Desktop Confirm)

- Radix Dialog primitive
- Max width: 420px
- Background: bg-surface-3
- Cancel (ghost) + Confirm (primary or destructive) buttons
- Backdrop: bg-overlay

### Sheet (Mobile Bottom Sheet)

- Radix Dialog with custom positioning
- Slides up from bottom
- Handle bar at top
- Max height: 90vh
- Used for: quick actions, confirm on mobile, add expense split editor on mobile

### Toast

- Radix Toast provider at root
- Position: bottom-right (desktop), bottom-center (mobile)
- Duration: 4 seconds for info/success; persist until dismissed for errors
- Variants: success (green), error (red), info (blue), neutral
- Undo toast: includes Undo button, 10-second duration

### Skeleton

- `bg-surface-2 animate-pulse rounded`
- Match approximate shape of loaded content
- Use on: all list pages before data loads, card content

### EmptyState

```
<EmptyState
  icon={<SomeIcon />}
  title="No expenses yet"
  description="Add your first expense to start tracking"
  action={<Button>Add expense</Button>}
/>
```

- Center-aligned in content area
- Icon in muted color
- Title in text-primary
- Description in text-muted
- Optional CTA button (primary)

### Avatar

- Circular, 32px (sm) / 40px (md)
- Initials fallback: first letter of display name, bg-surface-3
- If Clerk image available, show that

### Badge

- Rounded-full, px-2 py-0.5, text-xs
- Variants: neutral, success, warning, error, accent

---

## Interaction Patterns

### Loading States

Every list page follows:
1. Show `<Skeleton />` items (same count as typical list)
2. When data arrives, animate in with `opacity-0 → opacity-100`

### Empty States

Every list page shows `<EmptyState />` when:
- Data has loaded (not undefined)
- Array length === 0

Never show "No items" text without the full EmptyState component.

### Toasts

Required for:
- ✅ Successful create/edit/delete (neutral or success)
- ✅ Errors from mutations (error variant)
- ✅ Undo available (includes Undo button)
- ✅ Copy to clipboard

### Confirm Dialogs

Required for:
- Delete expense/settlement/chore/event/rule
- Leave household
- Clear all messages (if exists)

Pattern:
- Desktop: Radix Dialog
- Mobile: Radix Dialog styled as bottom sheet

### Forms

- Inline validation: validate on blur, show errors immediately
- Submit button disabled until form is valid
- Loading state on submit button during mutation
- On success: navigate away + show success toast
- On error: stay on form + show error toast + keep form data

### Keyboard Navigation

Desktop only:
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close dialogs/sheets
- Arrow keys for list navigation where applicable

---

## Responsive Breakpoints

```
Mobile:   < 768px   (default, mobile-first)
Tablet:   768–1023px (not a distinct layout, use mobile layout)
Desktop:  ≥ 1024px  (sidebar visible, content area wider)
```

Rule: Design mobile-first. Desktop is an enhancement, not an afterthought. At 375px width, every screen must be fully functional with no horizontal scroll.

---

## Motion + Animation

- Keep animations subtle: 150–200ms
- Use `transition-colors` and `transition-opacity` for state changes
- Sheet slide-up: `translate-y-full → translate-y-0`, 250ms ease-out
- Dialog: scale + fade, 150ms
- Toast: slide-in from bottom/right, 200ms
- Skeleton: `animate-pulse` (Tailwind built-in)
- No loading spinners on navigation — use skeleton instead

---

## Icon Usage (lucide-react)

Standard icon sizes:
- In buttons: `w-4 h-4` (16px)
- In nav: `w-5 h-5` (20px)
- In empty states: `w-8 h-8` (32px)
- In headings: `w-5 h-5` (20px)

Icon-only buttons always have `aria-label`.

Common icons:
```
Home, DollarSign, CheckSquare, Calendar, MoreHorizontal — bottom nav
Plus — add actions
Trash2 — delete
Pencil — edit
Copy — copy to clipboard
ChevronRight — navigation arrows
X — close/dismiss
Check — confirm/agree
RotateCcw — undo
Sparkles — AI assist
Users — members
Settings — settings
MessageSquare — chat
Megaphone — announcements
ScrollText — rules
```

---

## Screen Layout Template

Every app screen follows this structure:

```tsx
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="flex items-center justify-between px-4 py-3 border-b border-subtle">
    <h1 className="text-lg font-semibold text-primary">Screen Title</h1>
    <Button variant="ghost" size="sm"><Plus className="w-4 h-4" /></Button>
  </div>

  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
    {/* Content */}
  </div>
</div>
```

Desktop adds a content max-width constraint:
```tsx
<div className="max-w-2xl mx-auto">
  {/* content */}
</div>
```
