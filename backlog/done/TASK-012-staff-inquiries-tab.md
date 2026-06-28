# TASK-012 — Staff: Inquiries tab (received inquiries list)

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-011
**Effort:** S
**Risk:** low
**Status:** done

## Goal

Add an "Inquiries" tab to the staff panel showing all shop inquiries received from the public `/shop` page. The owner can see who enquired about what, click to expand the full item list, and mark inquiries as replied or closed.

## Acceptance criteria

- [x] "Inquiries" tab visible in staff navigation
- [x] Table shows: date, customer name, contact (phone or email), item count, status badge
- [x] Status badges: New (yellow), Replied (blue), Closed (grey)
- [x] Clicking a row expands: full item list with quantities and prices, customer message, contact details
- [x] "Mark Replied" button on expanded row → sets status to 'replied'
- [x] "Mark Closed" button → sets status to 'closed'
- [x] New inquiries (status='new') are visually distinct (e.g. bold row, yellow left border)
- [x] Inquiry count badge on the "Inquiries" nav tab shows count of status='new' (clears when all are replied/closed)
- [x] `npm run build` passes

## Test plan

```
InquiriesTab.test.jsx

- renders list of inquiries from Supabase mock
- new inquiry rows are visually distinct (bold or border)
- clicking row expands item list and contact details
- "Mark Replied" calls update with status='replied'
- "Mark Closed" calls update with status='closed'
- nav badge shows count of new inquiries
- badge disappears when all inquiries are replied/closed
```

## Implementation plan

### 1. New file: `src/components/staff/InquiriesTab.jsx`

**State:** `inquiries`, `loading`, `expandedId`

**Fetch:**
```js
const { data } = await supabase
  .from('shop_inquiries')
  .select('*')
  .order('created_at', { ascending: false })
```

### 2. Table layout
Same compact row pattern as the redesigned OrderQueue (TASK-001):
```
| Date | Customer | Contact | Items | Status |
```
Each row ~48px. Click to expand.

### 3. Expanded row
Shows:
```
Customer: John Smith  |  021 234 5678  |  john@email.com
Message: "Do you have the white version?"

Items:
  · Yonex Astrox 99  ×1  — $299.00
  · BG80 String      ×2  — $18.00 each

[Mark Replied]  [Mark Closed]
```

### 4. Status update
```js
async function setStatus(id, status) {
  await supabase.from('shop_inquiries').update({ status }).eq('id', id)
  setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
}
```

### 5. New inquiry badge
Pass `newCount` to the staff nav:
```js
const newCount = inquiries.filter(i => i.status === 'new').length
```
Display as a small red badge on the "Inquiries" tab button if `newCount > 0`.

### 6. Add tab to staff navigation
In `StaffPage.jsx` or the staff dashboard nav, add:
```jsx
<button onClick={() => setView('inquiries')}>
  Inquiries
  {newCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{newCount}</span>}
</button>
```
