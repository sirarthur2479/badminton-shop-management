import { render, screen } from '@testing-library/react'
import { isSaleActive } from './saleUtils'
import ProductCard from '../components/shop/ProductCard'

// ── isSaleActive unit tests ──────────────────────────────────────────────────

describe('isSaleActive', () => {
  it('returns true when sale_price is set and sale_ends_at is null', () => {
    expect(isSaleActive({ sale_price: 99, sale_ends_at: null })).toBe(true)
  })

  it('returns true when sale_price is set and sale_ends_at is in the future', () => {
    const future = new Date(Date.now() + 86400_000).toISOString()
    expect(isSaleActive({ sale_price: 99, sale_ends_at: future })).toBe(true)
  })

  it('returns false when sale_price is set but sale_ends_at is in the past', () => {
    const past = new Date(Date.now() - 86400_000).toISOString()
    expect(isSaleActive({ sale_price: 99, sale_ends_at: past })).toBe(false)
  })

  it('returns false when sale_price is null', () => {
    expect(isSaleActive({ sale_price: null, sale_ends_at: null })).toBe(false)
  })

  it('returns false when sale_price is 0', () => {
    expect(isSaleActive({ sale_price: 0, sale_ends_at: null })).toBe(false)
  })
})

// ── ProductCard rendering ────────────────────────────────────────────────────

const BASE = { id: '1', name: 'Test Racket', price: 349.00, description: '', image_url: null, visible: true }

describe('ProductCard — sale badge', () => {
  it('shows Sale badge when sale_price set and no expiry', () => {
    render(<ProductCard product={{ ...BASE, sale_price: 249.00, sale_ends_at: null }} enquireHref="#" />)
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('shows Sale badge when sale_price set and future expiry', () => {
    const future = new Date(Date.now() + 86400_000).toISOString()
    render(<ProductCard product={{ ...BASE, sale_price: 249.00, sale_ends_at: future }} enquireHref="#" />)
    expect(screen.getByText('Sale')).toBeInTheDocument()
  })

  it('shows NO Sale badge when sale_ends_at is in the past', () => {
    const past = new Date(Date.now() - 86400_000).toISOString()
    render(<ProductCard product={{ ...BASE, sale_price: 249.00, sale_ends_at: past }} enquireHref="#" />)
    expect(screen.queryByText('Sale')).not.toBeInTheDocument()
  })

  it('shows NO Sale badge when sale_price is null', () => {
    render(<ProductCard product={{ ...BASE, sale_price: null, sale_ends_at: null }} enquireHref="#" />)
    expect(screen.queryByText('Sale')).not.toBeInTheDocument()
  })

  it('renders crossed-out original price and red sale price when on sale', () => {
    render(<ProductCard product={{ ...BASE, sale_price: 249.00, sale_ends_at: null }} enquireHref="#" />)
    const crossed = document.querySelector('s')
    expect(crossed).not.toBeNull()
    expect(crossed.textContent).toMatch(/349/)
    expect(screen.getByText(/249/)).toBeInTheDocument()
  })

  it('shows only original price when sale_price is null', () => {
    render(<ProductCard product={{ ...BASE, sale_price: null, sale_ends_at: null }} enquireHref="#" />)
    expect(document.querySelector('s')).toBeNull()
    expect(screen.getByText(/349/)).toBeInTheDocument()
  })
})
