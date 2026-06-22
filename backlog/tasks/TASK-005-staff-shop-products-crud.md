# TASK-005 — Staff: Shop Products CRUD tab in InventoryManager

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-003
**Effort:** M
**Risk:** low
**Status:** todo

## Goal

Add a "Shop Products" tab to the existing `InventoryManager.jsx` so the owner can add, edit, delete, and toggle visibility of `shop_products` from the staff panel. Manual form entry only in this task — barcode scan (TASK-006) and CSV import (TASK-007) are separate. Follow the same patterns as the existing racket/string CRUD tabs.

## Acceptance criteria

- [ ] "Shop Products" tab appears in InventoryManager tab bar alongside existing tabs
- [ ] Tab shows a table of all `shop_products` rows: thumbnail, name, category, price, visible toggle
- [ ] "Add Product" button opens a form: name (required), category (dropdown), price, description, image_url, visible toggle
- [ ] Saving a new product inserts into `shop_products` and the row appears immediately in the table
- [ ] Clicking a row expands inline edit for all fields; Save updates the row; Cancel discards
- [ ] Visible toggle updates `visible` in Supabase immediately (optimistic update ok)
- [ ] Delete button on expanded row — confirmation required before delete
- [ ] Empty image_url shows grey placeholder in the table thumbnail
- [ ] `npm run build` passes

## Test plan

```
ShopProductsTab.test.jsx

- renders list of products from Supabase mock
- "Add Product" form submits and new row appears in list
- clicking row shows edit form pre-filled with current values
- save edit updates the row in the list
- visible toggle calls update with correct value
- delete with confirm removes row from list
- empty image_url shows placeholder in thumbnail
```

## Implementation plan

### 1. Add tab to `InventoryManager.jsx`
Current tab state drives which CRUD panel renders. Add `'shop'` as a new tab value.

Tab bar entry:
```jsx
<button onClick={() => setTab('shop')} className={tabClass('shop')}>
  Shop Products
</button>
```

### 2. Create `src/components/staff/ShopProductsTab.jsx`
Self-contained component that manages its own state (fetch, add, edit, delete).

**State:**
```js
const [products, setProducts] = useState([])
const [loading, setLoading] = useState(true)
const [expandedId, setExpandedId] = useState(null)
const [draft, setDraft] = useState({})
const [adding, setAdding] = useState(false)
const [addDraft, setAddDraft] = useState(emptyProduct())
```

**`emptyProduct()`:**
```js
{ name: '', category: 'racket', price: '', description: '', image_url: '', visible: true }
```

### 3. Supabase calls
```js
// fetch all
const { data } = await supabase.from('shop_products').select('*').order('category').order('name')

// insert
await supabase.from('shop_products').insert([{ ...addDraft, price: Number(addDraft.price) || null }])

// update
await supabase.from('shop_products').update({ ...draft, price: Number(draft.price) || null }).eq('id', expandedId)

// toggle visible
await supabase.from('shop_products').update({ visible: !product.visible }).eq('id', product.id)

// delete
await supabase.from('shop_products').delete().eq('id', id)
```

### 4. Category dropdown options
```js
const CATEGORIES = ['racket', 'string', 'shoe', 'bag', 'grip', 'shuttle', 'other']
```

### 5. Table layout
```
| [img] | Name         | Category | Price   | Visible |
|  40px | truncate     | badge    | NZD $XX | toggle  |
```
Clicking a row (not the visible toggle) sets `expandedId`.

### 6. Expanded inline edit
Same pattern as existing InventoryManager inline edits: form appears below the row with Save/Cancel/Delete buttons.

### 7. Image thumbnail
```jsx
{product.image_url
  ? <img src={product.image_url} className="w-10 h-10 object-cover rounded" />
  : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-lg">🏸</div>
}
```

### 8. Delete confirmation
Use `window.confirm('Delete this product?')` — matches the existing InventoryManager pattern. No modal needed.
