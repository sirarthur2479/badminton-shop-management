import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageUpload from './ImageUpload'

vi.mock('../../supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}))

import { supabase } from '../../supabaseClient'

// ── Slice 1: render + preview ────────────────────────────────────────────────

describe('ImageUpload — render and preview', () => {
  it('renders a hidden file input that accepts image files', () => {
    render(<ImageUpload value="" onChange={() => {}} />)
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input.accept).toBe('image/jpeg,image/png,image/webp')
  })

  it('shows "Upload image" label when no value is set', () => {
    render(<ImageUpload value="" onChange={() => {}} />)
    expect(screen.getByText(/upload image/i)).toBeInTheDocument()
  })

  it('shows preview thumbnail and "Change image" label when value is set', () => {
    render(<ImageUpload value="https://example.com/photo.jpg" onChange={() => {}} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
    expect(screen.getByText(/change image/i)).toBeInTheDocument()
  })

  it('shows no img element when value is empty', () => {
    render(<ImageUpload value="" onChange={() => {}} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})

// ── Slice 2: file size validation ───────────────────────────────────────────

describe('ImageUpload — file size validation', () => {
  it('shows size error and does not upload when file > 5MB', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ImageUpload value="" onChange={onChange} />)

    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 })

    const input = document.querySelector('input[type="file"]')
    await user.upload(input, bigFile)

    expect(screen.getByText(/too large/i)).toBeInTheDocument()
    expect(supabase.storage.from).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not show size error for a file <= 5MB', async () => {
    const user = userEvent.setup()
    const storageChain = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.example.com/x.jpg' } }),
    }
    supabase.storage.from.mockReturnValue(storageChain)

    render(<ImageUpload value="" onChange={() => {}} />)

    const smallFile = new File(['x'], 'small.jpg', { type: 'image/jpeg' })
    Object.defineProperty(smallFile, 'size', { value: 1024 })

    const input = document.querySelector('input[type="file"]')
    await user.upload(input, smallFile)

    expect(screen.queryByText(/too large/i)).not.toBeInTheDocument()
  })
})

// ── Slice 3: upload success ──────────────────────────────────────────────────

describe('ImageUpload — upload success', () => {
  it('calls supabase storage upload and fires onChange with the public URL', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const PUBLIC_URL = 'https://storage.example.com/abc.jpg'
    const storageChain = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: PUBLIC_URL } }),
    }
    supabase.storage.from.mockReturnValue(storageChain)

    render(<ImageUpload value="" onChange={onChange} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(supabase.storage.from).toHaveBeenCalledWith('product-images')
    expect(storageChain.upload).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith(PUBLIC_URL)
  })
})

// ── Slice 4: upload failure ──────────────────────────────────────────────────

describe('ImageUpload — upload failure', () => {
  it('shows error message and does not call onChange when upload fails', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const storageChain = {
      upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
      getPublicUrl: vi.fn(),
    }
    supabase.storage.from.mockReturnValue(storageChain)

    render(<ImageUpload value="" onChange={onChange} />)

    const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 1024 })

    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
