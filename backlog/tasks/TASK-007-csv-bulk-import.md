# TASK-007 — CSV bulk import for shop_products

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-005
**Effort:** S
**Risk:** low
**Status:** todo

## Goal

Add a CSV import button to the Shop Products tab so the owner can export their existing Google Sheets inventory and bulk-load it into `shop_products`. The CSV is parsed client-side; rows are batch-inserted into Supabase. Invalid rows are shown in an error summary without blocking valid rows.

## Acceptance criteria

- [ ] "Import CSV" button in the Shop Products tab header
- [ ] Clicking opens a file picker (accepts `.csv` only)
- [ ] Expected columns (case-insensitive, order flexible): `name` (required), `price` (optional), `category` (optional), `description` (optional), `image_url` (optional)
- [ ] Rows with empty `name` are skipped; all other rows are inserted with defaults for missing fields (`category='other'`, `visible=true`)
- [ ] After import, a summary shows: "X products imported, Y rows skipped (reason)"
- [ ] If `category` value is not in the allowed list, it defaults to `'other'` (not an error)
- [ ] Existing products are NOT modified — import only adds new rows
- [ ] `npm run build` passes

## Test plan

```
CsvImport.test.jsx

- valid CSV with name+price+category inserts correct rows
- rows with empty name are skipped
- missing price field defaults to null
- missing category defaults to 'other'
- invalid category value coerces to 'other'
- summary shows correct counts after import
- file picker only accepts .csv
```

## Implementation plan

### 1. CSV parsing — no library needed
Use browser `FileReader` + manual line/column splitting. No external CSV library (avoids bundle bloat for a simple case).

```js
function parseCSV(text) {
  const [headerLine, ...rows] = text.trim().split('\n')
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase())
  return rows.map(row => {
    const vals = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}
```

### 2. Field mapping + validation
```js
const VALID_CATEGORIES = ['racket','string','shoe','bag','grip','shuttle','other']

function mapRow(raw) {
  if (!raw.name?.trim()) return null  // skip
  return {
    name:        raw.name.trim(),
    price:       raw.price ? Number(raw.price) || null : null,
    category:    VALID_CATEGORIES.includes(raw.category) ? raw.category : 'other',
    description: raw.description || null,
    image_url:   raw.image_url || null,
    visible:     true,
  }
}
```

### 3. Batch insert
Supabase `insert` accepts an array — one call for all valid rows:
```js
const { error } = await supabase.from('shop_products').insert(validRows)
```

### 4. UI in `ShopProductsTab.jsx`
```jsx
<label className="cursor-pointer ...">
  Import CSV
  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
</label>
```

After insert, show a dismissable notice:
```
✓ 24 products imported. 3 rows skipped (empty name).
```

### 5. CSV template download
Add a "Download template" link next to the Import button that generates a minimal CSV:
```
name,price,category,description,image_url
Yonex Astrox 99,299,racket,,
```
Using `URL.createObjectURL(new Blob([template], { type: 'text/csv' }))`.
