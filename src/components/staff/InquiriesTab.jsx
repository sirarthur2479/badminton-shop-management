import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const STATUS_BADGE = {
  new: 'bg-yellow-100 text-yellow-800',
  replied: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-600',
}

const STATUS_LABEL = {
  new: 'New',
  replied: 'Replied',
  closed: 'Closed',
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function InquiriesTab() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('shop_inquiries')
        .select('*')
        .order('created_at', { ascending: false })
      setInquiries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function setStatus(id, status) {
    await supabase.from('shop_inquiries').update({ status }).eq('id', id)
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  if (loading) return <div className="p-6 text-gray-500">Loading...</div>
  if (inquiries.length === 0) return <div className="p-6 text-gray-400">No inquiries yet.</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Items</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map(inq => {
            const isNew = inq.status === 'new'
            const isExpanded = expandedId === inq.id
            const contact = inq.customer_phone || inq.customer_email || '—'
            const itemCount = (inq.items || []).length
            const rowBorder = isNew ? 'border-l-4 border-yellow-400' : 'border-l-4 border-transparent'

            return (
              <React.Fragment key={inq.id}>
                <tr
                  data-testid={`inquiry-row-${inq.id}`}
                  onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${rowBorder} ${isNew ? 'font-semibold' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(inq.created_at)}</td>
                  <td className="px-4 py-3 text-gray-900">{inq.customer_name}</td>
                  <td className="px-4 py-3 text-gray-600">{contact}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[inq.status] || inq.status}
                    </span>
                  </td>
                </tr>
                {isExpanded && (
                  <tr data-testid={`inquiry-expanded-${inq.id}`}>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="space-y-3">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Customer:</span> {inq.customer_name}
                          {inq.customer_phone && <span className="ml-3">{inq.customer_phone}</span>}
                          {inq.customer_email && <span className="ml-3">{inq.customer_email}</span>}
                        </div>
                        {inq.message && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Message:</span> {inq.message}
                          </div>
                        )}
                        <div className="text-sm text-gray-700">
                          <p className="font-medium mb-1">Items:</p>
                          <ul className="space-y-0.5 ml-4">
                            {(inq.items || []).map((item, i) => (
                              <li key={i} className="text-gray-600">
                                · {item.name} ×{item.qty} — ${Number(item.price).toFixed(2)} each
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-2 pt-1">
                          {inq.status !== 'replied' && inq.status !== 'closed' && (
                            <button
                              onClick={e => { e.stopPropagation(); setStatus(inq.id, 'replied') }}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
                            >
                              Mark Replied
                            </button>
                          )}
                          {inq.status !== 'closed' && (
                            <button
                              onClick={e => { e.stopPropagation(); setStatus(inq.id, 'closed') }}
                              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Mark Closed
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
