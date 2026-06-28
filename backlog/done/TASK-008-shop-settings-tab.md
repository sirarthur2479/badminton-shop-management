# TASK-008 — Staff: Shop Settings tab

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-003, TASK-004
**Effort:** S
**Risk:** low
**Status:** done

## Goal

Add a "Shop Settings" tab to the staff panel where the owner can edit the content that appears on the public `/shop` page: shop name, tagline, phone/WhatsApp number, contact email, accent colour (5 presets), and an about blurb. Changes save to the single `shop_settings` row in Supabase and immediately affect the public page on next load.

## Acceptance criteria

- [ ] "Settings" tab appears in staff navigation
- [ ] Form loads current values from `shop_settings` on mount
- [ ] Fields: shop name (required), tagline, phone, email, accent colour (radio/button group with 5 options), about blurb (textarea)
- [ ] Save button updates the `shop_settings` row; success message shown
- [ ] If no `shop_settings` row exists, the form inserts one on save
- [ ] Accent colour change is reflected on the `/shop` page on next visit (React Query stale time expires or user manually refreshes)
- [ ] Changing phone number updates the WhatsApp CTA link on `/shop`
- [ ] `npm run build` passes

## Test plan

```
ShopSettingsTab.test.jsx

- loads existing shop_settings values into form fields
- save calls Supabase update with correct payload
- accent_colour selection updates the field value
- required shop_name field prevents save if empty
- success message appears after save
```

## Implementation plan

### 1. New file: `src/components/staff/ShopSettingsTab.jsx`

```jsx
const ACCENT_COLOURS = [
  { value: 'green',  label: 'Green',  class: 'bg-green-600' },
  { value: 'navy',   label: 'Navy',   class: 'bg-blue-900' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-600' },
  { value: 'red',    label: 'Red',    class: 'bg-red-600' },
]
```

State: `form` object with all fields, `saving`, `saved` (brief success flash), `error`.

### 2. Load on mount
```js
useEffect(() => {
  supabase.from('shop_settings').select('*').single()
    .then(({ data }) => { if (data) setForm({ ...data }) })
}, [])
```

### 3. Save handler
```js
async function save() {
  setSaving(true)
  const { error } = await supabase.from('shop_settings')
    .upsert({ ...form }, { onConflict: 'id' })
  if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  setSaving(false)
}
```

### 4. Accent colour picker
Row of 5 coloured circles with a ring highlight on selected:
```jsx
{ACCENT_COLOURS.map(c => (
  <button key={c.value}
    className={`w-8 h-8 rounded-full ${c.class} ${form.accent_colour === c.value ? 'ring-2 ring-offset-2 ring-gray-900' : ''}`}
    onClick={() => setForm(f => ({ ...f, accent_colour: c.value }))}
    title={c.label}
  />
))}
```

### 5. How accent colour flows to `/shop`
In `ShopPage.jsx` + `ShopHeader.jsx`, map the `accent_colour` string to Tailwind classes:
```js
const ACCENT_MAP = {
  green:  { btn: 'bg-green-600 hover:bg-green-700', badge: 'text-green-700 bg-green-50' },
  navy:   { btn: 'bg-blue-900 hover:bg-blue-800',   badge: 'text-blue-700 bg-blue-50' },
  // ...
}
```
Use `ACCENT_MAP[settings?.accent_colour ?? 'green']` for CTA button classes.

Note: Tailwind purge requires class strings to appear verbatim in source — the `ACCENT_MAP` approach satisfies this since all strings are hardcoded in the map (not constructed dynamically).

### 6. Add tab to staff navigation
In `StaffPage.jsx` (or the staff nav component), add a Settings tile/button alongside Order Queue and Inventory.
