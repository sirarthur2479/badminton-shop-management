# TASK-009 — Sales/discount fields on products + sale badge on /shop

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-004, TASK-005
**Effort:** S
**Risk:** low
**Status:** done

## Goal

Allow the owner to mark any `shop_product` as on sale by setting a `sale_price` (and optional `sale_ends_at` expiry date). Product cards on `/shop` show a red "Sale" badge, the original price crossed out, and the sale price. Sales auto-expire client-side when `sale_ends_at` passes. The `sale_price` and `sale_ends_at` columns already exist from TASK-003.

## Acceptance criteria

- [x] Shop Products inline edit form (from TASK-005) shows `sale_price` and `sale_ends_at` fields
- [x] Setting `sale_price` on a product causes it to show a sale badge on `/shop` immediately after cache expires
- [x] Sale badge condition: `sale_price` is set AND (`sale_ends_at` is null OR `sale_ends_at` > now)
- [x] Product card shows: `<s>$X.XX</s>` original price + red `$Y.YY` sale price
- [x] Expired sales (`sale_ends_at` in the past) are silently treated as no-sale — no badge, original price shown
- [x] Clearing `sale_price` removes the sale badge
- [x] A "Sales" filtered view in the Shop Products tab shows only products currently on sale (sale_price set, not expired)
- [x] `npm run build` passes

## Test plan

```
SaleBadge.test.jsx

- product with sale_price and no sale_ends_at shows sale badge
- product with sale_price and future sale_ends_at shows sale badge
- product with sale_price and past sale_ends_at shows NO sale badge
- product without sale_price shows NO sale badge
- sale card renders crossed-out original price and red sale price
- clearing sale_price removes badge
```

## Implementation plan

### 1. Update `ShopProductsTab.jsx` inline edit form
Add two fields to the edit/add form:

```jsx
<div className="flex flex-col gap-1">
  <label className="text-xs font-medium text-gray-500">Sale Price (NZD) — leave blank for no sale</label>
  <input type="number" min="0" step="0.01" value={draft.sale_price || ''} onChange={d('sale_price')} className={fieldClass()} placeholder="e.g. 249.00" />
</div>
<div className="flex flex-col gap-1">
  <label className="text-xs font-medium text-gray-500">Sale Ends (optional)</label>
  <input type="date" value={draft.sale_ends_at ? draft.sale_ends_at.slice(0,10) : ''} onChange={d('sale_ends_at')} className={fieldClass()} />
</div>
```

### 2. Sale active helper (shared between ProductCard and any display)
```js
// src/lib/saleUtils.js
export function isSaleActive(product) {
  if (!product.sale_price) return false
  if (!product.sale_ends_at) return true
  return new Date(product.sale_ends_at) > new Date()
}
```

### 3. Update `ProductCard.jsx` (from TASK-004)
```jsx
const onSale = isSaleActive(product)

// Price display
{onSale ? (
  <div className="flex items-center gap-2">
    <span className="text-gray-400 line-through text-sm">${product.price?.toFixed(2)}</span>
    <span className="text-red-600 font-bold">${product.sale_price.toFixed(2)}</span>
    <Badge variant="destructive" className="text-xs">Sale</Badge>
  </div>
) : (
  <span className="font-semibold text-gray-900">${product.price?.toFixed(2) ?? 'POA'}</span>
)}
```

### 4. "Sales" filter tab in `ShopProductsTab.jsx`
Add a tab toggle above the product table:
```
[All]  [On Sale]
```
"On Sale" filter: `products.filter(p => isSaleActive(p))`

No new DB query needed — filter client-side from the already-fetched products list.
