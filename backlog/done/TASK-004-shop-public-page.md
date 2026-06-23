# TASK-004 — Public /shop page: product grid + category tabs + search + skeleton + React Query

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-002, TASK-003
**Effort:** L
**Risk:** medium
**Status:** done

## Goal

Build the public-facing `/shop` page. No auth required. Fetches `shop_products` (visible=true) and `shop_settings` from Supabase. Renders a professional product grid with category filter tabs, client-side search, skeleton loading, and a React Query cache (staleTime 5 min). Product cards show name, price, sale badge if discounted, and an "Enquire" button linking to WhatsApp or email from shop_settings. Design is clean/light — separate visual identity from the dark kiosk.

## Acceptance criteria

- [ ] `/shop` route is public (no PIN gate, no auth check)
- [ ] Page header shows `shop_settings.shop_name`, `shop_settings.tagline`, and a contact CTA (WhatsApp if phone set, else email)
- [ ] Product grid: 4-col desktop (≥1280px), 3-col (≥768px), 2-col (≥480px), 1-col mobile
- [ ] Category filter tabs: All + one per distinct category in the data; selected tab is visually highlighted
- [ ] Search input filters products client-side by name (case-insensitive, instant)
- [ ] Products with `sale_price` set (and `sale_ends_at` null or in the future) show: sale badge, crossed-out original price, sale price in red
- [ ] Products with no `image_url` show a grey placeholder with a racket icon
- [ ] On initial load, 12 skeleton cards render immediately; real data replaces them when the API returns
- [ ] Revisiting `/shop` within the same session shows cached data instantly (React Query cache)
- [ ] Mobile layout looks correct on 390px width (iPhone 14 Pro)
- [ ] `npm run build` passes

## Test plan

```
ShopPage.test.jsx

- renders skeleton cards before data loads
- renders product cards after data resolves
- category tab "Racket" filters to only racket products
- "All" tab shows all products
- search input filters products by name (case-insensitive)
- product with sale_price shows sale badge and crossed-out original price
- product without image_url shows placeholder
- Enquire button href uses shop_settings.phone for WhatsApp link
- Enquire button href falls back to email if no phone
```

## Implementation plan

### 1. Install React Query
```bash
npm install @tanstack/react-query
```
Wrap `<App>` in `<QueryClientProvider client={queryClient}>` in `src/main.jsx`.

### 2. New files
```
src/pages/ShopPage.jsx
src/components/shop/ShopHeader.jsx
src/components/shop/ProductGrid.jsx
src/components/shop/ProductCard.jsx
src/components/shop/ProductCardSkeleton.jsx
src/components/shop/CategoryTabs.jsx
src/components/shop/SearchBar.jsx
```

### 3. `ShopPage.jsx` — top-level layout
```jsx
export default function ShopPage() {
  const { data: settings } = useQuery({ queryKey: ['shop_settings'], queryFn: fetchSettings, staleTime: 10 * 60 * 1000 })
  const { data: products, isLoading } = useQuery({ queryKey: ['shop_products'], queryFn: fetchProducts, staleTime: 5 * 60 * 1000 })
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => filterProducts(products, category, search), [products, category, search])

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader settings={settings} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <CategoryTabs categories={categories(products)} selected={category} onChange={setCategory} />
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <ProductGrid products={visible} isLoading={isLoading} />
      </main>
    </div>
  )
}
```

### 4. Supabase fetch functions
```js
async function fetchProducts() {
  const { data } = await supabase.from('shop_products').select('*').eq('visible', true).order('category').order('name')
  return data || []
}
async function fetchSettings() {
  const { data } = await supabase.from('shop_settings').select('*').single()
  return data
}
```

### 5. `ProductCard.jsx`
Use shadcn `Card` component. Show:
- Image (1:1 aspect, object-cover, rounded-t-lg) or grey placeholder
- Sale badge (`<Badge variant="destructive">Sale</Badge>`) if sale active
- Name, description snippet (2-line clamp)
- Price: if on sale → `<s>$X.XX</s>` + `<span className="text-red-600">$Y.YY</span>`, else `$X.XX`
- "Enquire" button → href to `https://wa.me/{phone}?text=...` or `mailto:{email}`

Sale active check: `sale_price && (!sale_ends_at || new Date(sale_ends_at) > new Date())`

### 6. `ProductCardSkeleton.jsx`
Same dimensions as ProductCard but all content replaced with `animate-pulse bg-gray-200` divs.

### 7. `ProductGrid.jsx`
```jsx
const SKELETON_COUNT = 12
export default function ProductGrid({ products, isLoading }) {
  const items = isLoading ? Array(SKELETON_COUNT).fill(null) : products
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((p, i) => p ? <ProductCard key={p.id} product={p} /> : <ProductCardSkeleton key={i} />)}
    </div>
  )
}
```

### 8. Design tokens (Tailwind classes — no new config)
- Background: `bg-white`
- Card border: `border border-gray-200`
- Accent (CTA buttons): `bg-green-600 hover:bg-green-700 text-white`
- Secondary text: `text-gray-500`
- Heading: `text-gray-900 font-bold`

### 9. Add route in `App.jsx`
```jsx
import ShopPage from './pages/ShopPage'
// in <Routes>:
<Route path="/shop" element={<ShopPage />} />
```

### 10. Add "Our Shop" link in KioskHome footer (subtle, not prominent)
Small text link bottom-left: `<Link to="/shop" className="text-xs text-gray-400 hover:text-gray-600">Our Shop</Link>`
