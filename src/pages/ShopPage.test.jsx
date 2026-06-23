import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import ShopPage from './ShopPage'

vi.mock('../supabaseClient', () => ({
  supabase: { from: vi.fn() },
  isConfigured: () => true,
}))

import { supabase } from '../supabaseClient'

const SETTINGS = {
  shop_name: 'Test Shop',
  tagline: 'Best shop in town',
  phone: '6421000000',
  email: 'test@shop.com',
  accent_colour: 'green',
}

const PRODUCTS = [
  { id: '1', name: 'Yonex Astrox 99',  category: 'racket', price: 349.00, sale_price: null,   sale_ends_at: null, image_url: null, visible: true, description: 'A racket' },
  { id: '2', name: 'Victor Magan Bag',  category: 'bag',    price: 149.00, sale_price: 120.00, sale_ends_at: null, image_url: null, visible: true, description: 'A bag on sale' },
  { id: '3', name: 'Yonex BG80',        category: 'string', price: 22.00,  sale_price: null,   sale_ends_at: null, image_url: null, visible: true, description: 'A string' },
]

function makeChain(resolvedValue) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedValue, error: null }),
  }
  chain.order.mockResolvedValue({ data: resolvedValue, error: null })
  return chain
}

function wrapper(children) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ShopPage', () => {
  beforeEach(() => {
    supabase.from.mockImplementation((table) => {
      if (table === 'shop_settings') return makeChain(SETTINGS)
      if (table === 'shop_products') return makeChain(PRODUCTS)
      return makeChain([])
    })
  })

  it('renders skeleton cards before data loads', () => {
    render(wrapper(<ShopPage />))
    const skeletons = document.querySelectorAll('[data-testid="product-skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders product cards after data resolves', async () => {
    render(wrapper(<ShopPage />))
    await waitFor(() => expect(screen.getByText('Yonex Astrox 99')).toBeInTheDocument())
    expect(screen.getByText('Victor Magan Bag')).toBeInTheDocument()
    expect(screen.getByText('Yonex BG80')).toBeInTheDocument()
  })

  it('category tab "Racket" filters to only racket products', async () => {
    const user = userEvent.setup()
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByRole('button', { name: /racket/i }))
    expect(screen.getByText('Yonex Astrox 99')).toBeInTheDocument()
    expect(screen.queryByText('Victor Magan Bag')).not.toBeInTheDocument()
  })

  it('"All" tab shows all products', async () => {
    const user = userEvent.setup()
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.click(screen.getByRole('button', { name: /racket/i }))
    await user.click(screen.getByRole('button', { name: /^all$/i }))
    expect(screen.getByText('Victor Magan Bag')).toBeInTheDocument()
  })

  it('search input filters products by name case-insensitively', async () => {
    const user = userEvent.setup()
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    await user.type(screen.getByPlaceholderText(/search/i), 'bg80')
    expect(screen.getByText('Yonex BG80')).toBeInTheDocument()
    expect(screen.queryByText('Yonex Astrox 99')).not.toBeInTheDocument()
  })

  it('product with sale_price shows Sale badge and crossed-out original price', async () => {
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getByText('Victor Magan Bag'))
    expect(screen.getByText('Sale')).toBeInTheDocument()
    const crossed = document.querySelector('s')
    expect(crossed).not.toBeNull()
    expect(crossed.textContent).toMatch(/149/)
  })

  it('product without image_url shows placeholder', async () => {
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getByText('Yonex Astrox 99'))
    const placeholders = document.querySelectorAll('[data-testid="image-placeholder"]')
    expect(placeholders.length).toBeGreaterThan(0)
  })

  it('Enquire button uses WhatsApp link when phone is set', async () => {
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getAllByRole('link', { name: /enquire/i }))
    const links = screen.getAllByRole('link', { name: /enquire/i })
    expect(links[0].href).toMatch(/wa\.me/)
  })

  it('Enquire button falls back to email when no phone', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'shop_settings') return makeChain({ ...SETTINGS, phone: null })
      if (table === 'shop_products') return makeChain(PRODUCTS)
      return makeChain([])
    })
    render(wrapper(<ShopPage />))
    await waitFor(() => screen.getAllByRole('link', { name: /enquire/i }))
    const links = screen.getAllByRole('link', { name: /enquire/i })
    expect(links[0].href).toMatch(/mailto:/)
  })
})
