const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'GNAB Business Solutions <gnabsolutions@gmail.com>'
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  // If ALLOWED_ORIGIN is set, only allow that origin. Otherwise allow same Supabase project or localhost for dev.
  let allowOrigin = ''
  if (ALLOWED_ORIGIN && ALLOWED_ORIGIN !== '*') {
    allowOrigin = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ''
  } else if (origin) {
    // In dev / when ALLOWED_ORIGIN not set, echo known safe origins only
    const safe = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || (SUPABASE_URL && origin === new URL(SUPABASE_URL).origin)
    if (safe) allowOrigin = origin
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin || (ALLOWED_ORIGIN === '*' ? '*' : ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...extraHeaders, 'Content-Type': 'application/json' } })
}

function parseFrom(from: string): { email: string; name: string } {
  const m = from.match(/^(.*)<(.*)>$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: 'GNAB Business Solutions', email: from.trim() }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_HTML_LEN = 20000
const MAX_SUBJECT_LEN = 200
const MAX_PDF_BYTES = 5 * 1024 * 1024

function isAllowedPdfUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    // Only allow Supabase Storage public URLs for this project
    if (SUPABASE_URL) {
      const expectedHost = new URL(SUPABASE_URL).host
      // e.g. https://<project>.supabase.co/storage/v1/object/public/documents/...
      // or https://<project>.supabase.co/storage/v1/object/public/attachments/...
      if (u.host === expectedHost && u.pathname.startsWith('/storage/v1/object/public/')) return true
    }
    // Fallback: allow only known storage hosts (supabase.co)
    if (u.host.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/public/')) return true
    return false
  } catch { return false }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders)

  // Require auth: either Supabase anon key (from frontend) or service role.
  // This prevents open relay — only your site can trigger emails.
  const authHeader = req.headers.get('authorization') ?? ''
  const apikeyHeader = req.headers.get('apikey') ?? ''
  const hasAuth = authHeader.length > 5 || (SUPABASE_ANON_KEY && apikeyHeader === SUPABASE_ANON_KEY)
  if (!hasAuth && ALLOWED_ORIGIN) {
    // When ALLOWED_ORIGIN is configured (prod), require auth header
    return json({ error: 'Missing authorization' }, 401, corsHeaders)
  }
  // If ALLOWED_ORIGIN is empty (local dev without config), allow localhost without auth for testing
  const origin = req.headers.get('origin') ?? ''
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
  if (!hasAuth && !isLocalhost && !ALLOWED_ORIGIN) {
    // Still allow if request comes from same project ( Supabase functions gateway injects apikey )
    // Fallthrough — we already checked apikey above. If still here, deny.
    return json({ error: 'Missing authorization' }, 401, corsHeaders)
  }

  let body: { to?: string; subject?: string; html?: string; text?: string; pdfUrl?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400, corsHeaders) }

  const to = body.to?.trim()
  const subject = (body.subject?.trim() ?? 'Message from GNAB Business Solutions').slice(0, MAX_SUBJECT_LEN)
  let html = body.html ?? body.text ?? ''
  const pdfUrl = body.pdfUrl?.trim() || undefined

  if (!to || !EMAIL_RE.test(to)) return json({ error: 'Invalid recipient email' }, 400, corsHeaders)
  if (!html || html.length > MAX_HTML_LEN) return json({ error: html.length > MAX_HTML_LEN ? 'Email body too large' : 'Missing html' }, 400, corsHeaders)
  if (pdfUrl && !isAllowedPdfUrl(pdfUrl)) return json({ error: 'pdfUrl not allowed — must be a Supabase Storage public URL for this project' }, 400, corsHeaders)
  if (JSON.stringify(body).length > 25000) return json({ error: 'Payload too large' }, 413, corsHeaders)

  const hasBrevo = !!BREVO_API_KEY
  const hasResend = !!RESEND_API_KEY

  if (!hasBrevo && !hasResend) {
    console.log(`[send-email] No provider — would send to ${to} subject "${subject}"`)
    return json({ ok: true, dev: true, message: 'Email logged (no BREVO_API_KEY or RESEND_API_KEY). Set BREVO_API_KEY (recommended, free, no domain) or RESEND_API_KEY to enable real sending. See instructions.' }, 200, corsHeaders)
  }

  // Fetch PDF as base64 with allowlist + size cap + timeout
  let pdfBase64: string | null = null
  if (pdfUrl) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const pdfRes = await fetch(pdfUrl, { signal: controller.signal })
      clearTimeout(timeout)
      if (pdfRes.ok) {
        const len = Number(pdfRes.headers.get('content-length') || '0')
        if (len && len > MAX_PDF_BYTES) return json({ error: 'PDF too large' }, 413, corsHeaders)
        const buf = await pdfRes.arrayBuffer()
        if (buf.byteLength > MAX_PDF_BYTES) return json({ error: 'PDF too large' }, 413, corsHeaders)
        pdfBase64 = arrayBufferToBase64(buf)
      }
    } catch (e) {
      console.warn('[send-email] PDF fetch failed', e)
    }
  }

  const fromParsed = parseFrom(FROM_EMAIL)

  // Prefer Brevo
  if (hasBrevo) {
    console.log(`[send-email] Trying Brevo as ${fromParsed.email} to ${to}`)
    try {
      const brevoPayload: Record<string, unknown> = {
        sender: { email: fromParsed.email, name: fromParsed.name },
        to: [{ email: to }],
        subject,
        htmlContent: pdfUrl && !html.includes('Download PDF') ? `${html}<br><p><a href="${pdfUrl}">Download PDF</a></p>` : html,
      }
      if (pdfBase64) brevoPayload.attachment = [{ content: pdfBase64, name: 'GNAB-Document.pdf' }]
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY!, 'Content-Type': 'application/json' },
        body: JSON.stringify(brevoPayload),
      })
      if (!res.ok) {
        const txt = await res.text()
        console.error('Brevo error', txt)
        if (txt.toLowerCase().includes('sender') || txt.toLowerCase().includes('not verified')) {
          if (hasResend) console.log('[send-email] Brevo sender not verified, trying Resend fallback')
          else return json({ error: 'Email provider not configured: verify sender in Brevo dashboard.' }, 502, corsHeaders)
        } else if (!hasResend) {
          return json({ error: 'Failed to send email' }, 502, corsHeaders)
        }
      } else {
        const data = await res.json()
        console.log(`[send-email] Brevo sent to ${to} id ${data.messageId}`)
        return json({ ok: true, id: data.messageId, provider: 'brevo' }, 200, corsHeaders)
      }
    } catch (e) {
      console.error('[send-email] Brevo failed', e)
      if (!hasResend) return json({ error: 'Failed to send email' }, 502, corsHeaders)
    }
  }

  // Fallback: Resend
  try {
    const payload: Record<string, unknown> = {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: pdfUrl ? `${html}<br><p><a href="${pdfUrl}">Download PDF</a></p>` : html,
    }
    if (pdfBase64) payload.attachments = [{ filename: 'GNAB-Document.pdf', content: pdfBase64 }]
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.error('Resend error', txt)
      return json({ error: 'Failed to send email' }, 502, corsHeaders)
    }
    const data = await res.json()
    return json({ ok: true, id: data.id, provider: 'resend' }, 200, corsHeaders)
  } catch (e) {
    console.error(e)
    return json({ error: 'Failed to send email' }, 500, corsHeaders)
  }
})
