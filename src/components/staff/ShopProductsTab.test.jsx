import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShopProductsTab from './ShopProductsTab'

vi.mock('../../supabaseClient', () => ({
  supabase: { from: vi.fn() },
  isConfigured: () => true,
}))

import { supabase } from '../../supabaseClient'

const PRODUCTS = [
  { id: '1', name: 'Yonex Astrox 99', category: 'racket', price: 349.00, description: 'A great racket', image_url: 'https://example.com/racket.jpg', visible: true },
  { id: '2', name: 'Victor BG80',     category: 'string', price: 22.00,  description: 'A string',       image_url: null,                              visible: false },
]

function makeChain(resolvedValue) {
  const result = { data: resolvedValue, error: null }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then:   (res, rej) => Promise.resolve(result).then(res, rej),
    catch:  (rej)      => Promise.resolve(result).catch(rej),
  }
  return chain
}

function setupMock(products = PRODUCTS) {
  supabase.from.mockImplementation(() => makeChain(products))
}

// ── Slice 1: renders list ────────────────────────────────────────────────────

describe('ShopProductsTab — renders list', () => {
  beforeEach(() => setupMock())

  it('renders product names from Supabase mock', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => expect(screen.getByText('Yonex Astrox 99')).toBeInTheDocument())
    expect(screen.getByText('Victor BG80')).toBeInTheDocument()
  })

  it('shows category for each product', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    expect(screen.getByText('racket')).toBeInTheDocument()
    expect(screen.getByText('string')).toBeInTheDocument()
  })

  it('shows price formatted with NZD $', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    expect(screen.getByText(/NZD \$349/)).toBeInTheDocument()
  })

  it('shows image when image_url is set', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    const img = document.querySelector('img[src="https://example.com/racket.jpg"]')
    expect(img).not.toBeNull()
  })

  it('shows placeholder when image_url is empty', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Victor BG80'))
    const placeholders = document.querySelectorAll('[data-testid="img-placeholder"]')
    expect(placeholders.length).toBeGreaterThan(0)
  })
})

// ── Slice 2: Add Product form ────────────────────────────────────────────────

describe('ShopProductsTab — add product', () => {
  it('"Add Product" button opens the add form', async () => {
    const user = userEvent.setup()
    setupMock()
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByRole('button', { name: /add product/i }))
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('submitting add form calls supabase insert and new row appears', async () => {
    const user = userEvent.setup()
    const newProduct = { id: '3', name: 'New Grip', category: 'grip', price: 5.00, description: '', image_url: null, visible: true }
    let callCount = 0
    supabase.from.mockImplementation(() => {
      callCount++
      // first fetch returns original PRODUCTS, after insert refetch includes new product
      const products = callCount > 2 ? [...PRODUCTS, newProduct] : PRODUCTS
      return makeChain(products)
    })
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByRole('button', { name: /add product/i }))
    await user.type(screen.getByLabelText(/name/i), 'New Grip')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('New Grip')).toBeInTheDocument())
  })
})

// ── Slice 3: Inline edit ─────────────────────────────────────────────────────

describe('ShopProductsTab — inline edit', () => {
  beforeEach(() => setupMock())

  it('clicking a row shows an edit form pre-filled with product values', async () => {
    const user = userEvent.setup()
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByText('Yonex Astrox 99'))
    const nameInput = screen.getByDisplayValue('Yonex Astrox 99')
    expect(nameInput).toBeInTheDocument()
  })

  it('cancel edit discards changes', async () => {
    const user = userEvent.setup()
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByDisplayValue('Yonex Astrox 99')).not.toBeInTheDocument()
  })

  it('save edit calls supabase update and updates the row', async () => {
    const user = userEvent.setup()
    let saved = false
    supabase.from.mockImplementation(() => {
      const chain = makeChain(saved ? [{ ...PRODUCTS[0], name: 'Edited Name' }, PRODUCTS[1]] : PRODUCTS)
      chain.update = vi.fn(() => {
        saved = true
        return chain
      })
      return chain
    })
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByText('Yonex Astrox 99'))
    const nameInput = screen.getByDisplayValue('Yonex Astrox 99')
    await user.clear(nameInput)
    await user.type(nameInput, 'Edited Name')
    await user.click(screen.getByRole('button', { name: /^save$/i }))
    await waitFor(() => expect(screen.getByText('Edited Name')).toBeInTheDocument())
  })
})

// ── Slice 4: Visible toggle + Delete ────────────────────────────────────────

describe('ShopProductsTab — visible toggle and delete', () => {
  it('visible toggle calls supabase update with flipped value', async () => {
    const user = userEvent.setup()
    setupMock()
    const updateSpy = vi.fn().mockResolvedValue({ data: null, error: null })
    supabase.from.mockImplementation(() => {
      const chain = makeChain(PRODUCTS)
      chain.update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }))
      return chain
    })
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    const toggles = screen.getAllByRole('checkbox')
    await user.click(toggles[0])
    expect(supabase.from).toHaveBeenCalledWith('shop_products')
  })

  it('delete with confirm removes the row', async () => {
    const user = userEvent.setup()
    let deleted = false
    supabase.from.mockImplementation(() => {
      const chain = makeChain(deleted ? [PRODUCTS[1]] : PRODUCTS)
      chain.delete = vi.fn(() => ({ eq: vi.fn().mockImplementation(() => { deleted = true; return Promise.resolve({ data: null, error: null }) }) }))
      return chain
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await waitFor(() => expect(screen.queryByText('Yonex Astrox 99')).not.toBeInTheDocument())
  })
})

// ── Slice 5: CSV import button + file picker ──────────────────────────────────

describe('ShopProductsTab — CSV import button', () => {
  beforeEach(() => setupMock())

  it('renders an "Import CSV" button in the header', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    expect(screen.getByRole('button', { name: /import csv/i })).toBeInTheDocument()
  })

  it('file input accepts only .csv', async () => {
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input.accept).toBe('.csv')
  })
})

// ── Slice 6: batch insert + summary ──────────────────────────────────────────

describe('ShopProductsTab — CSV import batch insert + summary', () => {
  function makeFileEvent(csvContent) {
    const file = new File([csvContent], 'products.csv', { type: 'text/csv' })
    return { target: { files: [file], value: '' } }
  }

  it('inserts valid rows and shows success summary', async () => {
    setupMock()
    const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null })
    supabase.from.mockImplementation(() => {
      const chain = makeChain(PRODUCTS)
      chain.insert = insertSpy
      return chain
    })
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))

    const input = document.querySelector('input[type="file"]')
    const csv = 'name,price,category\nNew Grip,5,grip\nNew Shoe,80,shoe'
    await userEvent.upload(input, new File([csv], 'p.csv', { type: 'text/csv' }))

    await waitFor(() => expect(insertSpy).toHaveBeenCalledWith([
      { name: 'New Grip', price: 5, category: 'grip', description: null, image_url: null, visible: true },
      { name: 'New Shoe', price: 80, category: 'shoe', description: null, image_url: null, visible: true },
    ]))
    await waitFor(() => expect(screen.getByText(/2 products imported/i)).toBeInTheDocument())
  })

  it('shows skipped count for rows with empty name', async () => {
    setupMock()
    supabase.from.mockImplementation(() => {
      const chain = makeChain(PRODUCTS)
      chain.insert = vi.fn().mockResolvedValue({ data: null, error: null })
      return chain
    })
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))

    const input = document.querySelector('input[type="file"]')
    const csv = 'name,price\nGood Grip,5\n,10\n   ,20'
    await userEvent.upload(input, new File([csv], 'p.csv', { type: 'text/csv' }))

    await waitFor(() => expect(screen.getByText(/1 product imported/i)).toBeInTheDocument())
    expect(screen.getByText(/2 rows? skipped/i)).toBeInTheDocument()
  })

  it('shows "0 products imported, N skipped" when all rows invalid', async () => {
    setupMock()
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))

    const input = document.querySelector('input[type="file"]')
    const csv = 'name,price\n,5\n   ,10'
    await userEvent.upload(input, new File([csv], 'p.csv', { type: 'text/csv' }))

    await waitFor(() => expect(screen.getByText(/0 products imported/i)).toBeInTheDocument())
  })

  it('summary is dismissable', async () => {
    setupMock()
    supabase.from.mockImplementation(() => {
      const chain = makeChain(PRODUCTS)
      chain.insert = vi.fn().mockResolvedValue({ data: null, error: null })
      return chain
    })
    render(<ShopProductsTab />)
    await waitFor(() => screen.getByText('Yonex Astrox 99'))

    const input = document.querySelector('input[type="file"]')
    await userEvent.upload(input, new File(['name\nGrip'], 'p.csv', { type: 'text/csv' }))

    await waitFor(() => screen.getByText(/1 product imported/i))
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/products? imported/i)).not.toBeInTheDocument()
  })
})
