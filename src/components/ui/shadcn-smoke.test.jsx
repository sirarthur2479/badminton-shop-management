import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card, CardContent } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Sheet, SheetTrigger, SheetContent } from './sheet'

describe('shadcn/ui smoke tests', () => {
  it('Card renders its children', () => {
    render(<Card><CardContent>hello card</CardContent></Card>)
    expect(screen.getByText('hello card')).toBeInTheDocument()
  })

  it('Badge renders with default variant', () => {
    render(<Badge>new</Badge>)
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('shadcn Button renders without conflicting with shared/Button', async () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('Sheet opens and closes', async () => {
    const user = userEvent.setup()
    render(
      <Sheet>
        <SheetTrigger asChild>
          <button>open</button>
        </SheetTrigger>
        <SheetContent>sheet body</SheetContent>
      </Sheet>
    )
    expect(screen.queryByText('sheet body')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'open' }))
    expect(screen.getByText('sheet body')).toBeInTheDocument()
  })
})
