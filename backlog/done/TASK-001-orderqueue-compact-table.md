# TASK-001 — OrderQueue compact table layout with click-to-expand rows

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** —
**Effort:** M
**Risk:** low
**Status:** done

## Goal

Replace the current large rounded-card layout in `OrderQueue.jsx` (one card ~150px tall per order) with a compact table-row layout (~48px per row). The owner should see ~15 orders at a glance on a desktop/tablet without scrolling. Clicking a row expands an inline edit panel below it. Status and paid badges remain inline and clickable. Mobile (<640px) falls back to the current card layout.

No functional changes — all Supabase logic (fetch, cycleStatus, togglePaid, saveEdit) stays identical. This is a pure layout change.

## Acceptance criteria

- [ ] Desktop view renders orders as compact rows; a 1080p screen shows ≥12 rows without scrolling
- [ ] Each row shows: short order ID (mono), customer name + phone (stacked), racket·string·tension (single line), status badge (clickable to cycle), short date, paid badge (clickable to toggle)
- [ ] Clicking anywhere on a row (not the status/paid badge) expands an edit panel below that row; clicking again collapses it
- [ ] Only one row can be expanded at a time — expanding a second row collapses the first
- [ ] Status badge click cycles status without expanding the row edit panel
- [ ] Paid badge click toggles paid without expanding the row edit panel
- [ ] At viewport width <640px, rows revert to the existing card layout (no regressions on mobile)
- [ ] Search bar still filters rows correctly
- [ ] `npm run build` passes with no errors

## Test plan

```
orderqueue-table.test.jsx

- renders orders as table rows (not cards) on desktop
- clicking a row expands edit panel
- clicking the same row again collapses the edit panel
- expanding row B collapses previously expanded row A
- clicking status badge cycles status without expanding row
- clicking paid badge toggles paid without expanding row
- search input filters visible rows
```

## Implementation plan

### 1. State change
In `OrderQueue.jsx`:
- Replace `editingId` / `editDraft` / `savingEdit` / `editError` state with a single `expandedId` state (string | null)
- Keep `editDraft` etc. but gate them on `expandedId` — the form still needs draft state for the open row

### 2. Replace card list with table structure
Replace:
```jsx
<div className="flex flex-col gap-4">
  {filteredOrders.map(order => <div className="bg-white rounded-2xl ...">)}
</div>
```
With a div-based table (not `<table>` element — avoids colspan complexity on expand):
```jsx
<div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
  {filteredOrders.map(order => <OrderRow key={order.id} ... />)}
</div>
```

### 3. Extract `OrderRow` component (local, same file)
```jsx
function OrderRow({ order, expanded, onToggle, onCycleStatus, onTogglePaid, ... })
```
Row layout (desktop — `hidden sm:grid`):
```
grid-cols-[80px_1fr_2fr_120px_80px_80px]
```
Columns: #ID | Customer | Job | Status | Date | Paid

Mobile (`sm:hidden`): render existing card JSX unchanged (copy from current impl).

### 4. Expand panel
After each `OrderRow`, conditionally render:
```jsx
{expanded && (
  <div className="bg-gray-50 border-t border-gray-100 px-4 py-4">
    {/* existing edit form fields, unchanged */}
  </div>
)}
```

### 5. Click handling
- Row `onClick`: `onToggle(order.id)` — parent sets `expandedId = id === expandedId ? null : id`
- Status badge `onClick`: `e.stopPropagation(); onCycleStatus(order)` — prevents row toggle
- Paid badge `onClick`: `e.stopPropagation(); onTogglePaid(order)` — same

### 6. Responsive breakpoint
Wrap desktop grid in `<div className="hidden sm:grid ...">` and card layout in `<div className="sm:hidden">`.
