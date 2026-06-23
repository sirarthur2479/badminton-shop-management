import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BarcodeScanner from './BarcodeScanner'

vi.mock('../../supabaseClient', () => ({
  supabase: { from: vi.fn() },
  isConfigured: () => true,
}))

import { supabase } from '../../supabaseClient'

// BarcodeDetector is not defined in jsdom — tests run in the fallback branch by default

describe('BarcodeScanner — fallback (BarcodeDetector unavailable)', () => {
  it('renders manual text input when BarcodeDetector is not available', () => {
    render(<BarcodeScanner onResult={vi.fn()} />)
    expect(screen.getByPlaceholderText(/enter barcode/i)).toBeInTheDocument()
  })

  it('shows rate limit note', () => {
    render(<BarcodeScanner onResult={vi.fn()} />)
    expect(screen.getByText(/100 lookups\/day/i)).toBeInTheDocument()
  })
})

describe('BarcodeScanner — UPC lookup', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls onResult with name, description, image_url on successful lookup', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ title: 'Yonex BG80', description: 'A badminton string', images: ['https://example.com/bg80.jpg'] }],
      }),
    })
    const onResult = vi.fn()
    render(<BarcodeScanner onResult={onResult} />)

    await userEvent.type(screen.getByPlaceholderText(/enter barcode/i), '012345678901')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith({
      name: 'Yonex BG80',
      description: 'A badminton string',
      image_url: 'https://example.com/bg80.jpg',
    }))
  })

  it('does NOT include category in onResult', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ title: 'Test', description: '', images: [], category: 'sporting goods' }],
      }),
    })
    const onResult = vi.fn()
    render(<BarcodeScanner onResult={onResult} />)

    await userEvent.type(screen.getByPlaceholderText(/enter barcode/i), '000000000001')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => expect(onResult).toHaveBeenCalled())
    expect(onResult.mock.calls[0][0]).not.toHaveProperty('category')
  })

  it('shows "not found" message when barcode has no match', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    })
    render(<BarcodeScanner onResult={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText(/enter barcode/i), '999999999999')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => expect(screen.getByText(/not found.*fill/i)).toBeInTheDocument())
  })

  it('shows error message when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    render(<BarcodeScanner onResult={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText(/enter barcode/i), '111111111111')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => expect(screen.getByText(/lookup failed|error/i)).toBeInTheDocument())
  })

  it('shows error message when API response is not ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false })
    render(<BarcodeScanner onResult={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText(/enter barcode/i), '222222222222')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => expect(screen.getByText(/lookup failed|error/i)).toBeInTheDocument())
  })
})

describe('BarcodeScanner — ShopProductsTab integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  function makeChain() {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn((cb) => Promise.resolve(cb({ data: [], error: null }))),
    }
    return chain
  }

  it('renders Scan Barcode button in the Add Product form', async () => {
    const { default: ShopProductsTab } = await import('./ShopProductsTab')
    supabase.from.mockReturnValue(makeChain())

    render(<ShopProductsTab />)
    await userEvent.click(await screen.findByText('+ Add Product'))
    expect(screen.getByRole('button', { name: /scan barcode/i })).toBeInTheDocument()
  })

  it('pre-fills name, description, image_url after a successful lookup', async () => {
    const { default: ShopProductsTab } = await import('./ShopProductsTab')
    supabase.from.mockReturnValue(makeChain())

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ title: 'Test Racket', description: 'A great racket', images: ['https://img.example.com/racket.jpg'] }],
      }),
    })

    render(<ShopProductsTab />)
    await userEvent.click(await screen.findByText('+ Add Product'))
    await userEvent.click(screen.getByRole('button', { name: /scan barcode/i }))

    await userEvent.type(screen.getByPlaceholderText(/enter barcode/i), '012345678901')
    await userEvent.click(screen.getByRole('button', { name: /look up/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Racket')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('A great racket')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://img.example.com/racket.jpg')).toBeInTheDocument()
  })
})
