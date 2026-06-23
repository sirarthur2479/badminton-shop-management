import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ShopHeader from './ShopHeader'
import { InquiryProvider } from '../../contexts/InquiryContext'

function wrap(ui) { return <InquiryProvider>{ui}</InquiryProvider> }

describe('ShopHeader — accent colour', () => {
  it('applies navy accent class when accent_colour is navy', () => {
    const { container } = render(wrap(<ShopHeader settings={{ accent_colour: 'navy', shop_name: 'Test' }} />))
    const header = container.querySelector('header')
    expect(header.className).toMatch(/bg-blue-900/)
  })

  it('defaults to green accent when accent_colour is not set', () => {
    const { container } = render(wrap(<ShopHeader settings={{ shop_name: 'Test' }} />))
    const header = container.querySelector('header')
    expect(header.className).toMatch(/bg-green-600/)
  })

  it('applies orange accent class when accent_colour is orange', () => {
    const { container } = render(wrap(<ShopHeader settings={{ accent_colour: 'orange', shop_name: 'Test' }} />))
    const header = container.querySelector('header')
    expect(header.className).toMatch(/bg-orange-500/)
  })
})
