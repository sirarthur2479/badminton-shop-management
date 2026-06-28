# TASK-006 — Barcode scan + UPC lookup auto-fill in product add form

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-005
**Effort:** M
**Risk:** medium
**Status:** todo

## Goal

Add a "Scan Barcode" flow to the Shop Products "Add Product" form. Staff taps the button, the camera opens (using web `BarcodeDetector` API on supported browsers), the scanned UPC/EAN is sent to the UPC Item DB API, and the form auto-fills with the returned product name, description, and image URL. Staff then sets the price, confirms the category, and saves.

Handles: unsupported browser (text input fallback), barcode not found in database (manual entry), and the 100 req/day rate limit (display remaining count from response headers).

## Acceptance criteria

- [ ] "Scan Barcode" button appears in the Add Product form
- [ ] On supported browsers (Safari iOS 17+, Chrome 83+), tapping the button opens the camera for barcode scanning
- [ ] On unsupported browsers, a text input for manual barcode entry appears instead
- [ ] After a successful scan, the form fields name, description, and image_url are pre-filled from UPC Item DB response
- [ ] Category is NOT auto-filled — owner must choose (UPC API categories don't map cleanly to our schema)
- [ ] If the barcode is not found in UPC Item DB, a "Not found — fill manually" message appears and the form stays editable
- [ ] If the UPC Item DB returns an error or network fails, a user-friendly error message appears
- [ ] A note "UPC Item DB: 100 lookups/day on free tier" is visible near the button
- [ ] `npm run build` passes

## Test plan

```
BarcodeScanner.test.jsx

- renders manual input fallback when BarcodeDetector is not available
- successful UPC lookup pre-fills name, description, image_url
- category field NOT pre-filled after lookup
- "not found" response shows manual entry message
- network error shows error message
- rate limit note is visible in the UI
```

## Implementation plan

### 1. New component: `src/components/staff/BarcodeScanner.jsx`
```jsx
export default function BarcodeScanner({ onResult, onError })
```
- Detects `'BarcodeDetector' in window`
- Supported: render `<video>` element + start stream + scan frames
- Unsupported: render `<input type="text" placeholder="Enter barcode number…" />`

BarcodeDetector usage:
```js
const detector = new BarcodeDetector({ formats: ['ean_13', 'upc_a', 'upc_e'] })
// requestAnimationFrame loop scanning videoEl
const [barcode] = await detector.detect(videoEl)
if (barcode) { stream.stop(); onResult(barcode.rawValue) }
```

### 2. UPC Item DB lookup
```js
async function lookupBarcode(upc) {
  const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`)
  if (!res.ok) throw new Error('Lookup failed')
  const json = await res.json()
  const item = json.items?.[0]
  if (!item) return null
  return {
    name: item.title || '',
    description: item.description || '',
    image_url: item.images?.[0] || '',
  }
}
```

### 3. Integrate into Add Product form in `ShopProductsTab.jsx`
Add "Scan Barcode" button above the name field:
```jsx
<BarcodeScanner onResult={async (upc) => {
  const info = await lookupBarcode(upc)
  if (info) setAddDraft(d => ({ ...d, ...info }))
  else setLookupError('Barcode not found — fill in manually')
}} />
```

### 4. Rate limit note
Static text below the button:
```jsx
<p className="text-xs text-gray-400">UPC Item DB free tier: 100 lookups/day</p>
```

### 5. Camera cleanup
Stop the media stream when the component unmounts or after a successful scan to avoid leaving the camera active.

### 6. Risk: BarcodeDetector availability
- Safari iOS 17+: ✓
- Chrome 83+ on Android: ✓
- Firefox: ✗ (text fallback)
- Chrome on Windows: ✗ (text fallback — but staff will mostly use iPad anyway)
