# TASK-011 — Inquiry list (cart) + submit → email owner

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-004, TASK-003
**Effort:** L
**Risk:** medium
**Status:** done

## Goal

Add an "Add to Inquiry" flow to the public `/shop` page. Customers can add products to a local inquiry list, then submit it with their name/contact details. On submit, the inquiry is saved to `shop_inquiries` in Supabase and an email is sent to the shop owner via a new Resend edge function (separate from the existing stringing order notification function).

## Acceptance criteria

- [ ] Each product card has an "Add to Inquiry" button (replaces the "Enquire" direct WhatsApp link from TASK-004 — or coexists alongside it)
- [ ] A floating badge/button shows the inquiry count; clicking opens a slide-out Sheet (shadcn/ui)
- [ ] Inquiry sheet shows selected products with name, price, quantity (default 1), and a remove button per item
- [ ] Customer fills in: name (required), phone or email (at least one required), optional message
- [ ] Submit saves to `shop_inquiries` table and calls Supabase edge function `send-shop-inquiry` 
- [ ] Owner receives email listing: customer name/contact, each item with name+price+quantity, total, message
- [ ] Email failures are silent — inquiry is still saved to DB even if email fails
- [ ] After submit: sheet shows confirmation with inquiry ID; cart clears
- [ ] Inquiry list persists in `localStorage` across page reloads (customer doesn't lose their list)
- [ ] `npm run build` passes

## Test plan

```
InquirySheet.test.jsx

- "Add to Inquiry" adds product to inquiry list state
- inquiry count badge updates
- removing an item decrements list
- submit with name + email calls supabase.from('shop_inquiries').insert()
- submit without name shows validation error
- submit without phone AND email shows validation error
- success state shows confirmation message
- inquiry list persists after page reload (localStorage)
```

## Implementation plan

### 1. Inquiry list state — React context + localStorage
```
src/contexts/InquiryContext.jsx
```
```js
const InquiryContext = createContext()
export function InquiryProvider({ children }) {
  const [items, setItems] = useLocalStorage('inquiry_list', [])
  function addItem(product) {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      return existing
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }
  function removeItem(id) { setItems(prev => prev.filter(i => i.id !== id)) }
  function clear() { setItems([]) }
  return <InquiryContext.Provider value={{ items, addItem, removeItem, clear }}>{children}</InquiryContext.Provider>
}
export const useInquiry = () => useContext(InquiryContext)
```

Simple `useLocalStorage` hook (10 lines — no library needed).

Wrap `<ShopPage>` in `<InquiryProvider>`.

### 2. Update `ProductCard.jsx`
Add "Add to Inquiry" button:
```jsx
const { addItem } = useInquiry()
<button onClick={() => addItem(product)} className="...">Add to Inquiry</button>
```

### 3. Floating inquiry button in `ShopHeader.jsx`
```jsx
const { items } = useInquiry()
const count = items.reduce((n, i) => n + i.qty, 0)
<button onClick={() => setSheetOpen(true)} className="relative ...">
  🛒 {count > 0 && <span className="badge">{count}</span>}
</button>
```

### 4. `InquirySheet.jsx` (shadcn Sheet, slides from right)
Sections:
- Item list: name, quantity stepper (+/-), unit price, remove × button
- Contact form: name*, phone or email*, message (optional)
- Submit button
- Success state: "Inquiry #XXXX sent!"

### 5. Submit handler
```js
async function submit() {
  if (!name) { setError('Name required'); return }
  if (!phone && !email) { setError('Phone or email required'); return }
  const { data, error } = await supabase.from('shop_inquiries').insert([{
    customer_name: name, customer_phone: phone, customer_email: email,
    items: items, message, status: 'new'
  }]).select().single()
  if (error) { setError(error.message); return }
  // fire-and-forget email
  supabase.functions.invoke('send-shop-inquiry', { body: { inquiry: data } })
  clear()
  setSubmitted(data.id)
}
```

### 6. New Supabase Edge Function: `send-shop-inquiry`
New file: `supabase/functions/send-shop-inquiry/index.ts`

Email template (Resend):
```
Subject: New shop inquiry from {customer_name}
Body:
  Customer: {name} | {phone} | {email}
  Message: {message}
  
  Items requested:
    - Yonex Astrox 99 × 2  — $299.00 each
    - ...
  
  Total items: N
  
  Reply to this email or contact the customer directly.
```

Fetch shop_settings to get the owner's email address as the recipient.

### 7. DB: `shop_inquiries` table (if not added in TASK-003)
```sql
create table if not exists shop_inquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  items         jsonb not null,
  message       text,
  status        text default 'new'
);
```
