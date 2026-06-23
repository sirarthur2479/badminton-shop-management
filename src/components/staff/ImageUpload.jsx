import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

const MAX_BYTES = 5 * 1024 * 1024

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError(null)
    if (file.size > MAX_BYTES) {
      setError('File too large (max 5MB)')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      {value && <img src={value} alt="Product" className="w-24 h-24 object-cover rounded mb-2" />}
      <label className="cursor-pointer inline-block px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
        {uploading ? 'Uploading…' : value ? 'Change image' : 'Upload image'}
        <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
      </label>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
