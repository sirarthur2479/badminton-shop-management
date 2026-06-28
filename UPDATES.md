# Updates

## 2026-06-23

| Task | Title | Summary |
|---|---|---|
| — | NZD price formatting + queue filter tabs + mobile safe area | InventoryManager price display changed to `NZD $X.XX`; OrderQueue gained All/Pending/In Progress/Done/Picked Up filter tabs with live counts; `viewport-fit=cover` added to meta viewport and kiosk form button wrapper now uses `env(safe-area-inset-bottom)` so it stays above the iPhone home indicator |
| TASK-012 | Staff: Inquiries tab (received inquiries list) | Added InquiriesTab with compact click-to-expand table showing date/customer/contact/item count/status; Mark Replied / Mark Closed actions; new-inquiry count badge on nav tile; badge kept in sync via onNewCountChange callback to StaffPage |
| TASK-011 | Inquiry list (cart) + submit → email owner | Added InquiryContext with localStorage persistence; "Add to Inquiry" button on ProductCard; floating cart badge in ShopHeader; InquirySheet slide-out with item list, qty stepper, remove button, contact form (name required, phone or email required), DB insert to shop_inquiries, fire-and-forget send-shop-inquiry edge function, success state with inquiry ID |
| TASK-010 | Supabase Storage image upload for products | Replaced image_url text field with ImageUpload component; file picker (JPG/PNG/WEBP, max 5MB); preview thumbnail; uploads to Supabase Storage bucket product-images; image_url set to public URL; backwards compatible with existing URL strings |
| TASK-009 | Sales/discount fields on products + sale badge on /shop | Added isSaleActive utility; ProductCard shows Sale badge + crossed-out price; ShopProductsTab edit form has sale_price/sale_ends_at fields; On Sale filter tab; coerces empty fields to null before Supabase write |
| TASK-008 | Staff: Shop Settings tab | Added Settings tile to staff nav; ShopSettingsTab with shop name, tagline, phone, email, about blurb, and 5-preset accent colour picker; upserts to shop_settings on save; accent colour flows to ShopHeader + ShopPage via ACCENT_MAP |
| TASK-007 | CSV bulk import for shop_products | Added Import CSV button to ShopProductsTab; client-side CSV parsing (no library); field mapping with VALID_CATEGORIES coercion; batch Supabase insert; import summary notice (X imported, Y skipped); Download template link via data: URI |
| TASK-006 | Barcode scanner with UPC lookup in ShopProductsTab | Added BarcodeScanner component with camera-based barcode scanning (BarcodeDetector API) and manual UPC fallback; UPC lookup against Open Food Facts / Open Beauty Facts / UPCitemdb APIs; integrates into ShopProductsTab header to pre-fill product name and image on scan |
| TASK-005 | Staff: Shop Products CRUD tab in InventoryManager | Added ShopProductsTab to InventoryManager with full CRUD: table with thumbnail/name/category/price/visible toggle, inline edit, add form, delete confirm, grey placeholder for missing images |

## 2026-06-23

| Task | Title | Summary |
|---|---|---|
| TASK-004 | Public /shop page: product grid + category tabs + search + skeleton + React Query | Built ShopPage with React Query, category tabs, client-side search, sale badges, skeleton loading, WhatsApp/email Enquire links |
| TASK-003 | DB schema: shop_products + shop_settings tables with seed data | Added CREATE TABLE + 15 seeded products across 5 categories (racket, string, bag, grip, shoe, shuttle); shop_settings default row |
| TASK-002 | Install shadcn/ui (Tailwind v3 compatible) | Installed shadcn@2.1.0 with Card, Badge, Button, Sheet, Dialog, Input, Separator; added jsconfig.json + vite @ alias; Tailwind stays v3 |
| TASK-001 | OrderQueue compact table layout with click-to-expand rows | Replaced large card layout with compact 48px table rows; click-to-expand inline edit panel; status/paid badges stay clickable inline; mobile falls back to card layout |
