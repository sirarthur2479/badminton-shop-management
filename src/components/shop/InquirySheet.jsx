import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import { useInquiry } from '../../contexts/InquiryContext'
import { supabase } from '../../supabaseClient'

export default function InquirySheet({ open, onClose }) {
  const { items, removeItem, clear } = useInquiry()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [submittedId, setSubmittedId] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    if (!phone.trim() && !email.trim()) { setError('Phone or email is required.'); return }
    setError(null)
    const { data, error: dbError } = await supabase
      .from('shop_inquiries')
      .insert([{ customer_name: name, customer_phone: phone || null, customer_email: email || null, items, message: message || null, status: 'new' }])
      .select()
      .single()
    if (dbError) { setError(dbError.message); return }
    supabase.functions.invoke('send-shop-inquiry', { body: { inquiry: data } })
    clear()
    setSubmittedId(data.id)
  }

  function handleClose() {
    setSubmittedId(null)
    setName(''); setPhone(''); setEmail(''); setMessage(''); setError(null)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && handleClose()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Inquiry List</SheetTitle>
        </SheetHeader>

        {submittedId ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12 text-center">
            <p className="text-green-700 font-semibold text-lg">Inquiry sent!</p>
            <p className="text-sm text-gray-500">Reference: <span className="font-mono">{submittedId}</span></p>
            <button onClick={handleClose} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Close</button>
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Your inquiry list is empty.</p>
            ) : (
              <ul className="divide-y divide-gray-100 mt-4">
                {items.map(item => (
                  <li key={item.id} className="flex items-center justify-between py-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">${item.price?.toFixed(2)} × {item.qty}</p>
                    </div>
                    <button
                      aria-label="Remove"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 text-xs px-2 py-1 rounded transition-colors">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                placeholder="Your name *"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                placeholder="Phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Message (optional)"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors">
                Send Inquiry
              </button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
