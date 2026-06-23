import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp'

// Map MIME type to extension; fall back to 'jpg' for unknown image types.
function extFromType(type) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  return map[type] ?? 'jpg'
}

export default function ImageUpload({ value, onChange, onUploading }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  function setUploadingState(val) {
    setUploading(val)
    onUploading?.(val)
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('File too large (max 5MB)')
      return
    }
    setUploadingState(true)
    try {
      const path = `${crypto.randomUUID()}.${extFromType(file.type)}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        return
      }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setUploadingState(false)
      onChange(data.publicUrl)
    } catch (err) {
      setError(err?.message ?? 'Upload failed')
    } finally {
      setUploadingState(false)
    }
  }

  return (
    <div>
      {value && <img src={value} alt="Product" className="w-24 h-24 object-cover rounded mb-2" />}
      <label className="cursor-pointer inline-block px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
        {uploading ? 'Uploading…' : value ? 'Change image' : 'Upload image'}
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFile}
          onClick={e => { e.target.value = '' }}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
