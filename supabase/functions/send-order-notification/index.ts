import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'
const SHOP_NAME = Deno.env.get('SHOP_NAME') ?? 'Badminton Pro Shop'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order, type } = await req.json()

    if (!order?.customer_email) return json({ skipped: 'no customer email' })
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY not set' }, 500)

    const orderId = `#${order.id.slice(-8).toUpperCase()}`
    const racket = `${order.racket_brand_name} ${order.racket_model_name}`.trim()
    const string = `${order.string_brand_name} ${order.string_model_name}`.trim()

    let subject: string
    let html: string

    if (type === 'order_created') {
      subject = `Order ${orderId} confirmed — ${racket}`
      html = orderConfirmedHtml({ order, orderId, racket, string })
    } else if (type === 'order_done') {
      subject = `Your racket is ready for pickup! — ${orderId}`
      html = orderDoneHtml({ order, orderId, racket, string })
    } else {
      return json({ error: `unknown type: ${type}` }, 400)
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SHOP_NAME} <${FROM_EMAIL}>`,
        to: order.customer_email,
        subject,
        html,
      }),
    })

    // Resend may return non-JSON on certain errors (e.g. 429 rate limit with plain-text body)
    const contentType = res.headers.get('content-type') ?? ''
    const resBody = contentType.includes('application/json')
      ? await res.json()
      : { raw: await res.text() }

    return json(resBody, res.status)
  } catch (err) {
    // Always return CORS headers so the browser sees the real error, not a CORS failure
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

function baseHtml(title: string, content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#2563eb;padding:28px 32px">
      <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700">🏸 ${SHOP_NAME}</p>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;color:#111827">${title}</h1>
      ${content}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px">
      <p style="margin:0;font-size:13px;color:#9ca3af">This is an automated message from ${SHOP_NAME}. Please don't reply to this email.</p>
    </div>
  </div>
</body>
</html>`
}

function detailsTable(rows: [string, string][]) {
  const cells = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 12px;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="padding:10px 12px;color:#111827;font-size:14px;font-weight:500">${value}</td>
      </tr>`)
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-top:20px">${cells}</table>`
}

function orderConfirmedHtml({ order, orderId, racket, string }: {
  order: Record<string, string>
  orderId: string
  racket: string
  string: string
}) {
  const rows: [string, string][] = [
    ['Order ID', orderId],
    ['Racket', racket],
    ['String', string],
    ['Tension', `${order.tension_lbs} lbs`],
  ]
  if (order.notes) rows.push(['Notes', order.notes])

  return baseHtml('Order confirmed!', `
    <p style="color:#374151;font-size:16px;margin:0 0 4px">Hi ${order.customer_name},</p>
    <p style="color:#374151;font-size:16px;margin:0">We've received your stringing order. We'll email you again as soon as your racket is ready.</p>
    ${detailsTable(rows)}
  `)
}

function orderDoneHtml({ order, orderId, racket, string }: {
  order: Record<string, string>
  orderId: string
  racket: string
  string: string
}) {
  const rows: [string, string][] = [
    ['Order ID', orderId],
    ['Racket', racket],
    ['String', string],
    ['Tension', `${order.tension_lbs} lbs`],
  ]

  return baseHtml('Your racket is ready! 🎉', `
    <p style="color:#374151;font-size:16px;margin:0 0 4px">Hi ${order.customer_name},</p>
    <p style="color:#374151;font-size:16px;margin:0">Your racket has been strung and is ready for pickup. Come grab it anytime!</p>
    ${detailsTable(rows)}
    <div style="margin-top:24px;padding:16px;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0">
      <p style="margin:0;color:#065f46;font-size:15px;font-weight:600">Ready for pickup</p>
    </div>
  `)
}
