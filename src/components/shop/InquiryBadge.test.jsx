import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InquiryProvider } from '../../contexts/InquiryContext'
import ProductCard from './ProductCard'
import ShopHeader from './ShopHeader'

const PRODUCT = { id: '1', name: 'Yonex Astrox 99', price: 349.00, image_url: null, description: null, sale_price: null, sale_ends_at: null }
const SETTINGS = { shop_name: 'Test Shop', accent_colour: 'green' }

function wrap(ui) {
  return <InquiryProvider>{ui}</InquiryProvider>
}

describe('ProductCard — Add to Inquiry', () => {
  it('renders an "Add to Inquiry" button', () => {
    render(wrap(<ProductCard product={PRODUCT} enquireHref="#" />))
    expect(screen.getByRole('button', { name: /add to inquiry/i })).toBeInTheDocument()
  })

  it('clicking "Add to Inquiry" increments the count badge', async () => {
    const user = userEvent.setup()
    render(wrap(
      <>
        <ShopHeader settings={SETTINGS} />
        <ProductCard product={PRODUCT} enquireHref="#" />
      </>
    ))
    expect(screen.queryByTestId('inquiry-count')).toBeNull()
    await user.click(screen.getByRole('button', { name: /add to inquiry/i }))
    expect(screen.getByTestId('inquiry-count')).toHaveTextContent('1')
  })

  it('count badge updates to 2 after clicking twice', async () => {
    const user = userEvent.setup()
    render(wrap(
      <>
        <ShopHeader settings={SETTINGS} />
        <ProductCard product={PRODUCT} enquireHref="#" />
      </>
    ))
    await user.click(screen.getByRole('button', { name: /add to inquiry/i }))
    await user.click(screen.getByRole('button', { name: /add to inquiry/i }))
    expect(screen.getByTestId('inquiry-count')).toHaveTextContent('2')
  })
})
