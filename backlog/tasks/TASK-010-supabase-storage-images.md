# TASK-010 — Supabase Storage image upload for products

**Use case:** [ideas/use-cases/shop-storefront.md](../../ideas/use-cases/shop-storefront.md)
**Research:** —
**Depends on:** TASK-005
**Effort:** M
**Risk:** medium
**Status:** todo

## Goal

Replace the plain `image_url` text field in the product form with an actual file upload widget backed by Supabase Storage. The owner can upload a product photo from their iPad or phone directly in the staff panel — no Imgur or external hosting knowledge needed. Uploaded images are served via Supabase Storage public URL.

## Acceptance criteria

- [ ] Product add/edit form shows an image upload button (file picker: JPG/PNG/WEBP, max 5MB)
- [ ] After selecting a file, a preview thumbnail appears in the form
- [ ] On save, the file is uploaded to Supabase Storage bucket `product-images` and `image_url` is set to the public URL
- [ ] The URL text field (from TASK-005) is replaced by the upload widget — users can no longer type URLs directly (reduces confusion)
- [ ] If upload fails (network error, file too large), an error message appears and the product is NOT saved
- [ ] Existing products with a URL in `image_url` continue to show that image (backwards compatible)
- [ ] `npm run build` passes

## Test plan

```
ImageUpload.test.jsx

- file input accepts image files
- preview thumbnail renders after file selection
- upload calls supabase.storage.from('product-images').upload()
- image_url in saved product is the public URL
- file > 5MB shows size error before upload
- upload failure shows error and does not save product
- existing text URL in image_url still renders as image (backwards compat)
```

## Implementation plan

### 1. Create Supabase Storage bucket
In Supabase Dashboard → Storage → New bucket:
- Name: `product-images`
- Public: yes (so images serve without auth)

Or via `supabase/schema.sql` storage policy (if using Supabase CLI):
```sql
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
```

Add RLS policy to allow anonymous reads and authenticated (anon key) uploads:
```sql
create policy "Public read" on storage.objects for select using (bucket_id = 'product-images');
create policy "Anon upload" on storage.objects for insert with check (bucket_id = 'product-images');
```

### 2. New component: `src/components/staff/ImageUpload.jsx`
```jsx
export default function ImageUpload({ value, onChange }) {
  // value = current image_url string
  // onChange = (url: string) => void
  const [preview, setPreview] = useState(value)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('File too large (max 5MB)'); return }
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
    if (uploadError) { setError(uploadError.message); setUploading(false); return }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    setPreview(data.publicUrl)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      {preview && <img src={preview} className="w-24 h-24 object-cover rounded mb-2" />}
      <label className="cursor-pointer inline-block px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
        {uploading ? 'Uploading…' : preview ? 'Change image' : 'Upload image'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
```

### 3. Replace text field in `ShopProductsTab.jsx`
In the add/edit form, replace:
```jsx
<input type="url" value={draft.image_url} onChange={d('image_url')} ... />
```
With:
```jsx
<ImageUpload value={draft.image_url} onChange={url => setDraft(d => ({ ...d, image_url: url }))} />
```

### 4. Backwards compatibility
Existing products with a URL string in `image_url` (set via old text field or barcode lookup) continue to work — the `<img src={image_url}>` in ProductCard doesn't care whether the URL is from Storage or elsewhere.
