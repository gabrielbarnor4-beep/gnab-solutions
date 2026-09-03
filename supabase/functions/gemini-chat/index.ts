const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const MODEL = 'gemini-2.0-flash'
const FALLBACK_MODEL = 'gemini-1.5-flash'

const MAX_CONTENTS = 10
const MAX_TEXT_LEN = 2000
const MAX_TOTAL_BYTES = 8000

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  let allowOrigin = ''
  if (ALLOWED_ORIGIN && ALLOWED_ORIGIN !== '*') {
    allowOrigin = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ''
  } else if (origin) {
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

interface GeminiPart { text: string }
interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[] }

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...extraHeaders, 'Content-Type': 'application/json' } })
}

function isValidContents(arr: unknown): arr is GeminiContent[] {
  if (!Array.isArray(arr) || arr.length === 0 || arr.length > MAX_CONTENTS) return false
  for (const item of arr) {
    if (typeof item !== 'object' || item === null) return false
    const c = item as Record<string, unknown>
    if (c.role !== 'user' && c.role !== 'model') return false
    if (!Array.isArray(c.parts) || c.parts.length === 0) return false
    for (const p of c.parts as unknown[]) {
      if (typeof p !== 'object' || p === null) return false
      const t = (p as Record<string, unknown>).text
      if (typeof t !== 'string' || t.length === 0 || t.length > MAX_TEXT_LEN) return false
    }
  }
  return true
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders)
  if (!GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY secret is not configured' }, 500, corsHeaders)

  // Require auth (anon key from frontend) — prevents open LLM burn
  const authHeader = req.headers.get('authorization') ?? ''
  const apikeyHeader = req.headers.get('apikey') ?? ''
  const hasAuth = authHeader.length > 5 || (SUPABASE_ANON_KEY && apikeyHeader === SUPABASE_ANON_KEY)
  const origin = req.headers.get('origin') ?? ''
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')
  if (!hasAuth && !isLocalhost) {
    // In prod with ALLOWED_ORIGIN set, we still want auth
    // Allow localhost without auth for local preview
    return json({ error: 'Missing authorization' }, 401, corsHeaders)
  }

  let body: { contents?: unknown; systemInstruction?: unknown }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body' }, 400, corsHeaders) }

  // Size guard before parsing
  const rawLen = JSON.stringify(body).length
  if (rawLen > MAX_TOTAL_BYTES) return json({ error: 'Payload too large' }, 413, corsHeaders)

  const contents = body.contents
  let systemInstruction: { parts: { text: string }[] } | undefined
  if (typeof body.systemInstruction === 'string') {
    if (body.systemInstruction.length > 3000) return json({ error: 'systemInstruction too large' }, 413, corsHeaders)
    systemInstruction = { parts: [{ text: body.systemInstruction.slice(0, 3000) }] }
  } else if (body.systemInstruction !== undefined) {
    return json({ error: 'Invalid systemInstruction' }, 400, corsHeaders)
  }

  if (!isValidContents(contents)) return json({ error: 'Invalid contents — must be 1-10 items with role user|model and text 1-2000 chars' }, 400, corsHeaders)

  // Use header instead of query param to avoid logging key
  const callGemini = async (model: string) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
        body: JSON.stringify({
          ...(systemInstruction ? { systemInstruction } : {}),
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
      }
    )
    return res
  }

  try {
    let res = await callGemini(MODEL)
    if (!res.ok && res.status === 404) res = await callGemini(FALLBACK_MODEL)
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`Gemini upstream ${res.status}: ${detail.slice(0, 200)}`)
      return json({ error: 'Upstream error' }, 502, corsHeaders)
    }
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return json({ text: text ?? null }, 200, corsHeaders)
  } catch (err) {
    console.error('Gemini fetch failed', err)
    return json({ error: 'Upstream request failed' }, 502, corsHeaders)
  }
})
