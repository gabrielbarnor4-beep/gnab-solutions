import { supabase } from '@/lib/supabase'
import { CATALOGUE } from '@/lib/catalogue'
import { CONTACT, FORMSPREE_ENDPOINT } from '@/lib/utils'

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  cards?: { name: string; desc: string; to: string; badge?: string; external?: boolean }[]
  chips?: string[]
  time: number
}

const uid = () => Math.random().toString(36).slice(2)

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]! as T

export const WELCOME_MESSAGE = (): ChatMessage => ({
  id: uid(),
  role: 'bot',
  text: pick([
    `Hello! 👋 I'm the **GNAB Assistant**.\n\nI can help you:\n- Find products across our catalogue\n- Explain how ordering works\n- Take you anywhere on the site\n\nWhat can I do for you today?`,
    `Hi there! 😊 Welcome to GNAB.\n\nAsk me about our products, pricing or delivery — or just tell me what you're looking for and I'll point you the right way.`,
    `Welcome! ✨ I'm here to make sourcing easy.\n\nLooking for something specific? Type it in — or tap one of the options below to explore.`,
  ]),
  chips: ['Browse services', 'Find a product', 'How does quoting work?', 'Talk to a human'],
  time: Date.now(),
})

const STOPWORDS = new Set([
  'the', 'a', 'an', 'for', 'of', 'and', 'to', 'in', 'on', 'with', 'i', 'we',
  'you', 'me', 'my', 'our', 'is', 'are', 'do', 'does', 'need', 'want', 'get',
  'have', 'can', 'please', 'some', 'any', 'it', 'that', 'this', 'be', 'us',
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function findBestService(query: string) {
  const words = tokenize(query)
  if (words.length === 0) return null
  let best: (typeof CATALOGUE)[number] | null = null
  let bestScore = 0
  for (const cat of CATALOGUE) {
    const hay = `${cat.title} ${cat.shortTitle} ${cat.intro}`.toLowerCase()
    let score = 0
    for (const w of words) if (hay.includes(w)) score++
    if (score > bestScore) { bestScore = score; best = cat }
  }
  return bestScore > 0 ? best : null
}

function buildRelevantGeneric(input: string): Reply {
  const bestService = findBestService(input)
  const weak = findProducts(input).slice(0, 2)
  let text = `Thanks for asking about **"${input.slice(0, 80)}"** — I'm still learning to answer that precisely. While our team prepares a detailed answer, here's the most relevant info I can share right now:`
  if (bestService) {
    text += `\n\nThis looks related to **${bestService.title}** — ${bestService.intro}\n\nYou can explore all ${bestService.products.length} items in that catalogue on the [${bestService.title} page](/products?category=${bestService.slug}) or [request a quote](/quote?category=${bestService.slug}) for a 24h price.`
  } else {
    text += `\n\nWe cover 8 procurement areas: **Office Stationery & Consumables, IT Equipment & Accessories, Cleaning & Janitorial Supplies, PPE & Safety, Office Furniture, Printing & Branding, Electrical Materials and Custom Sourcing.** Tell us the spec and we source it — even outside the catalogue.`
  }
  if (weak.length > 0) {
    text += `\n\nBased on your question, these might be relevant:`
  }
  return {
    text,
    cards: weak.length > 0 ? weak.map((r) => r.card) : [{ name: 'Browse all services', desc: 'See our 8 procurement catalogues', to: '/services' }],
    chips: ['Talk to a human', 'Request a quote'],
  }
}

/* ---------------- Product recommendation — word-based, not substring ---------------- */
export function findProducts(query: string) {
  const words = tokenize(query)
  if (words.length === 0) return []
  const scored = new Map<string, { score: number; name: string; desc: string; slug: string; title: string; shortTitle: string }>()

  for (const cat of CATALOGUE) {
    for (const p of cat.products) {
      const nameTokens = p.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      const hayTokens = `${p.name} ${p.desc} ${cat.title}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      const haySet = new Set(hayTokens)
      let score = 0
      for (const w of words) {
        if (p.name.toLowerCase() === w) score += 5
        else if (nameTokens.includes(w)) score += 3
        else if (haySet.has(w)) score += 1
      }
      if (score > 0) {
        const prev = scored.get(p.name)
        if (!prev || prev.score < score)
          scored.set(p.name, { score, name: p.name, desc: p.desc, slug: cat.slug, title: cat.title, shortTitle: cat.shortTitle })
      }
    }
  }

  return [...scored.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => ({
      score: r.score,
      card: {
        name: r.name,
        desc: r.desc,
        badge: r.shortTitle,
        to: `/quote?product=${encodeURIComponent(r.name)}&category=${r.slug}`,
      },
    }))
}

/* ---------------- Intent engine ---------------- */
export type Reply = { text: string; cards?: ChatMessage['cards']; chips?: string[] }

const PRODUCT_INTROS = [
  `Great news — we stock that! 🎯 Here are the closest matches from our catalogue.\n\nTap any product to get its price instantly:`,
  `Yes, we can supply that 👍 These are the best matches I found — tap one to request a quote right away:`,
  `Good choice — that's right in our wheelhouse 💪 Pick a product below and I'll take you straight to its quote page:`,
  `We've got you covered! Here's what matches your search — tap any card for an instant price request:`,
]

const FALLBACKS = [
  `Hmm, that one's a bit outside my script 🤔 But here's what I'm great at: finding **products**, explaining **delivery**, and getting you a **quote** fast.`,
  `I didn't quite catch that — I'm still learning! 😅 Try me on things like *“do you have printer toner?”* or *“how long does delivery take?”*`,
  `That might be a question best answered by our team 🙋 You can reach them right away on WhatsApp, or ask me about products, quotes and delivery.`,
]

/* ---------------- Admin-curated FAQ — answers admin provides for previously unanswered questions ---------------- */
export interface AssistantFaq {
  id: string
  question: string
  answer: string
}

let faqCache: AssistantFaq[] | null = null
let faqCacheAt = 0

async function fetchPublishedFaqs(): Promise<AssistantFaq[]> {
  const now = Date.now()
  if (faqCache && now - faqCacheAt < 30000) return faqCache
  try {
    const { data, error } = await supabase
      .from('assistant_questions')
      .select('id, question, answer')
      .eq('status', 'published')
      .not('answer', 'is', null)
      .limit(100)
    if (!error && data) {
      faqCache = data as AssistantFaq[]
      faqCacheAt = now
      return faqCache
    }
  } catch {
    /* ignore */
  }
  return faqCache ?? []
}

function findFaqMatch(input: string, faqs: AssistantFaq[]): AssistantFaq | null {
  const tokens = tokenize(input)
  if (tokens.length === 0 || faqs.length === 0) return null
  let best: AssistantFaq | null = null
  let bestScore = 0
  for (const faq of faqs) {
    const hay = faq.question.toLowerCase()
    let score = 0
    for (const w of tokens) {
      if (hay.includes(w)) score += 1
    }
    // Require at least 2 overlapping tokens or 50% overlap for longer queries
    const threshold = Math.max(2, Math.ceil(tokens.length * 0.4))
    if (score >= threshold && score > bestScore) {
      bestScore = score
      best = faq
    }
  }
  return best
}

async function logUnansweredQuestion(question: string): Promise<void> {
  const trimmed = question.trim().slice(0, 500)
  if (trimmed.length < 4) return
  try {
    // Avoid spamming: if same question pending, bump asked_count
    const { data: existing } = await supabase
      .from('assistant_questions')
      .select('id, asked_count')
      .eq('question', trimmed)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()
    if (existing) {
      await supabase.from('assistant_questions').update({ asked_count: (existing.asked_count ?? 1) + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('assistant_questions').insert({ question: trimmed, status: 'pending' })
    }
    // Also email admin via Formspree (so you get mail notification too)
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: 'New Assistant Question Awaiting Answer — GNAB',
          question: trimmed,
          source: 'GNAB Assistant Widget',
          action_required: 'Answer in Admin → Assistant Q&A to teach the assistant.',
        }),
      })
    } catch {
      /* non-fatal */
    }
  } catch {
    /* non-fatal */
  }
}

export function localBrain(rawInput: string): Reply {
  const q = rawInput.toLowerCase().trim()

  /* small talk */
  if (/\b(how are you|how's it going|how are things)\b/.test(q)) {
    return {
      text: pick([
        `I'm doing great, thanks for asking! 😄 Ready to help you source anything you need. How can I help?`,
        `Running at full speed as always ⚡ What can I do for you today?`,
      ]),
      chips: ['What do you supply?', 'Request a quote', 'Contact details'],
    }
  }
  if (/\b(your name|who are you|what are you|are you (a )?(bot|robot|human|real))\b/.test(q)) {
    return {
      text: `I'm the **GNAB Assistant** 🤖 — a virtual helper for GNAB Business Solutions.\n\nI can find products, explain how we work and connect you with our human team anytime. What would you like to know?`,
      chips: ['What do you supply?', 'How does quoting work?', 'Talk to a human'],
    }
  }
  if (/\b(bye|goodbye|see you|later|good ?night|thank.*bye)\b/.test(q)) {
    return {
      text: pick([
        `Thanks for stopping by! 👋 Feel free to come back anytime — we're here Mon–Fri, 8am–5pm GMT.`,
        `Goodbye for now! 😊 If anything comes up, you know where to find us.`,
      ]),
      chips: ['Request a quote', 'Contact details'],
    }
  }
  if (/^(help|what can you do|menu|options)\b/.test(q)) {
    return {
      text: `Here's what I can help with:\n- 🔍 **Find products** — type what you need\n- 💰 **Quotations** — how pricing works\n- 🚚 **Delivery** — timelines & coverage\n- 📞 **Human contact** — phone, WhatsApp, email`,
      chips: ['Find a product', 'How does quoting work?', 'Delivery times', 'Talk to a human'],
    }
  }

  /* greetings (time-aware) */
  if (/^(hi|hii+|hello|hey|yo|howdy|good (morning|afternoon|evening)|morning|afternoon|evening)\b/.test(q)) {
    const hour = new Date().getHours()
    const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
    return {
      text: pick([
        `Good ${partOfDay}! ☀️ Welcome to **GNAB Business Solutions**. How can I help you today?`,
        `Hello and good ${partOfDay}! 😊 What can I do for you?`,
        `Hi! Good ${partOfDay} 🌟 Looking for a product, a quote, or just exploring?`,
      ]),
      chips: ['What do you supply?', 'Request a quote', 'Contact details'],
    }
  }

  /* thanks */
  if (/\b(thank|thanks|thnx|appreciate)\b/.test(q)) {
    return {
      text: pick([
        `You're most welcome! Is there anything else I can help with? 😊`,
        `Anytime! 🙌 Happy to help whenever you need.`,
        `It's my pleasure! Let me know if there's anything else.`,
      ]),
      chips: ['Not for now', 'Request a quote'],
    }
  }

  /* human handoff */
  if (/\b(human|person|agent|someone|sales|representative|call me|speak to|talk to)\b/.test(q)) {
    return {
      text: pick([
        `Of course — our team would love to hear from you! 📞\n- Phone: [${CONTACT.phone}](tel:${CONTACT.phoneRaw})\n- WhatsApp: [Chat with us](${CONTACT.whatsappLink})\n- Email: [${CONTACT.email}](mailto:${CONTACT.email})\n\nOr use the [contact form](/contact) and we'll respond within hours.`,
        `Sure! The fastest route to a real person is WhatsApp 👉 [${CONTACT.whatsapp}](${CONTACT.whatsappLink}). Prefer email? It's [${CONTACT.email}](mailto:${CONTACT.email}) — or call [${CONTACT.phone}](tel:${CONTACT.phoneRaw}).`,
      ]),
      chips: ['Business hours', 'Where are you located?'],
    }
  }

  /* contact info */
  if (/\b(contact|email|phone|number|whatsapp|reach|location|address|where.*(located|based)|office)\b/.test(q)) {
    return {
      text: `Here's how to reach us 📞\n- **Phone:** [${CONTACT.phone}](tel:${CONTACT.phoneRaw})\n- **WhatsApp:** [${CONTACT.whatsapp}](${CONTACT.whatsappLink})\n- **Email:** [${CONTACT.email}](mailto:${CONTACT.email})\n- **Address:** ${CONTACT.address}\n\nMore options on the [Contact page](/contact).`,
      chips: ['Business hours', 'How does quoting work?'],
    }
  }

  /* hours */
  if (/\b(hours|open|closing|when.*(open|close)|working days?)\b/.test(q)) {
    return {
      text: pick([
        `We're open **Monday to Friday, 8:00 AM – 5:00 PM GMT**, and closed on weekends.\n\nMessages sent outside these hours are answered first thing the next business day.`,
        `Our doors are open **Mon–Fri, 8am–5pm GMT** 🕗 Weekend messages get answered first thing Monday morning.`,
      ]),
      chips: ['Contact details', 'Request a quote'],
    }
  }

  /* quote process — handles quote, quotes, quoting, quoted, quotation, quotations */
  if (/\b(quot\w*|rfq|price|pricing|cost|how much|rate)\b/.test(q)) {
    return {
      text: pick([
        `Great question — happy to explain how it works! 😊 Getting a quote is simple, free, and there's no obligation until you say yes:\n\n**1.** Share what you need via the [quote form](/quote) — as much detail as you have\n**2.** We source and negotiate with our 100+ vetted suppliers behind the scenes\n**3.** You get a clear, itemised quotation within **24 hours** — valid while you decide\n\nWant me to take you there? Just tap below and I'll pre-fill what you need.`,
        `I'd love to walk you through it! Just head to our [quote form](/quote), tell us what you need, and within **24 hours** you'll have a transparent, no-obligation price in your inbox 📩 — we handle the sourcing and negotiation for you.`,
        `Pricing is refreshingly simple: send us your requirements through the [quote form](/quote), we do the legwork with our supplier network, and you get one honest price — ready within a day ⏱️ No hidden fees, no pressure until you approve.`,
      ]),
      chips: ['Request a quote now', 'What products do you have?'],
    }
  }

  /* delivery */
  if (/\b(deliver|delivery|shipping|ship|logistics|how long|lead time)\b/.test(q)) {
    return {
      text: pick([
        `We deliver **nationwide across Ghana** 🚚 Standard items usually arrive within 2–5 working days of order approval; bulk or custom-sourced items vary by availability — your quotation always includes an exact timeline.`,
        `Anywhere in Ghana! 🇬🇭 Expect standard orders in **2–5 working days** after approval. Bigger or custom-sourced orders depend on availability, and the exact date is always stated on your quotation.`,
      ]),
      chips: ['How does quoting work?', 'Talk to a human'],
    }
  }

  /* services overview */
  if (/\b(service(s)?|what do you (do|offer|supply)|catalogue|categories)\b/.test(q)) {
    return {
      text: pick([
        `We cover eight procurement catalogues:\n- Office Stationery & Consumables\n- IT Equipment & Accessories\n- Cleaning & Janitorial Supplies\n- PPE & Safety Equipment\n- Office Furniture\n- Printing & Branding\n- Electrical Materials\n- Custom Sourcing\n\nExplore any of them on the [Services page](/services) or tell me a specific item you need!`,
        `In short: if your organisation needs it, we source it 📦 From stationery and IT equipment to PPE, furniture, printing and electrical materials — plus a custom sourcing service for everything else. Full list on the [Services page](/services).`,
      ]),
      chips: ['Show me IT equipment', 'Find office chairs', 'Request a quote'],
    }
  }

  /* industries */
  if (/\b(industr(y|ies)|who do you serve|sectors?|government|school|hospitals?|hotels?|ngo)\b/.test(q)) {
    return {
      text: pick([
        `We serve organisations of every kind — corporate firms, government institutions, schools & universities, hospitals, hotels, construction companies, NGOs and SMEs.\n\nSee how we support each one on the [Industries page](/industries).`,
        `Everyone from government ministries to startups! 🏢🏥🏫 We work with corporates, schools, hospitals, hotels, construction firms, NGOs and SMEs across Ghana — see the details on the [Industries page](/industries).`,
      ]),
      chips: ['What services do you offer?', 'Request a quote'],
    }
  }

  /* why us */
  if (/\b(why (choose|gnab)|benefit|advantage|trust|reliable|guarantee|quality)\b/.test(q)) {
    return {
      text: pick([
        `Clients choose GNAB because we offer:\n- **100+ vetted suppliers** — one call gets anything sourced\n- **Competitive pricing** through bulk purchasing power\n- **24-hour quotations**, always transparent\n- **Quality assurance** on every single order\n- A dedicated account manager who knows your business\n\nRead more on the [Why Us page](/why-us).`,
        `Fair question! Three big reasons: our **100+ vetted supplier network** means nothing is out of reach, our **24-hour transparent quotations** mean no surprises, and every client gets a **dedicated account manager** who actually knows their business 🤝 More on the [Why Us page](/why-us).`,
      ]),
      chips: ['See client reviews', 'Request a quote'],
    }
  }

  /* reviews */
  if (/\b(review(s)?|testimonial(s)?|feedback|experience)\b/.test(q)) {
    return {
      text: pick([
        `Our clients say it best! Read their experiences on the [Reviews page](/testimonials) — and if you've worked with us, we'd love to hear yours too ⭐`,
        `You can read genuine feedback from organisations we serve on the [Reviews page](/testimonials). We publish every approved review unedited 🙂`,
      ]),
      chips: ['Leave a review', 'What services do you offer?'],
    }
  }

  /* supplier */
  if (/\b(supplier|vendor|partner with|become a|distributor|reseller)\b/.test(q)) {
    return {
      text: pick([
        `We're always looking for reliable suppliers! 🤝 Apply through our [Supplier Registration form](/supplier-registration) — applications are reviewed within five working days.`,
        `Interested in partnering with us? Wonderful 🙌 Fill in the [Supplier Registration form](/supplier-registration) and our team will review your application within five working days.`,
      ]),
      chips: ['What do you supply?', 'Contact details'],
    }
  }

  /* about */
  if (/\b(about|who (are|is) gnab|company|mission|vision|history)\b/.test(q)) {
    return {
      text: pick([
        `**GNAB Business Solutions** is Ghana's trusted procurement and supply partner — one point of contact for sourcing, purchasing and delivering quality products.\n\n**Mission:** simplify procurement through reliable sourcing, competitive pricing and timely delivery.\n**Vision:** become Ghana's most trusted procurement partner.\n\nLearn more on the [About page](/about).`,
        `In a nutshell: we make procurement effortless 🇬🇭 One call to GNAB connects you to 100+ vetted suppliers, competitive bulk pricing and doorstep delivery anywhere in Ghana. Our story's on the [About page](/about).`,
      ]),
      chips: ['What services do you offer?', 'Talk to a human'],
    }
  }

  /* process */
  if (/\b(process|steps?|how (do|does) (it|ordering|order)|order)\b/.test(q)) {
    return {
      text: pick([
        `Our six-step process keeps everything clear ✅\n1. Receive Request → 2. Source Products → 3. Prepare Quotation → 4. Client Approval → 5. Delivery → 6. After-Sales Support\n\nFull details on the [Process page](/process), or jump straight to a [quote request](/quote).`,
        `Simple and transparent: you tell us what you need → we source it → you get a quote within 24h → you approve → we deliver → we stay available afterwards ✅ Walk through each step on the [Process page](/process).`,
      ]),
      chips: ['How does quoting work?', 'Delivery times'],
    }
  }

  /* navigation */
  const navMap: [RegExp, string, string][] = [
    [/\b(home|start|main page)\b/, '/', 'the homepage'],
    [/\babout\b/, '/about', 'the About page'],
    [/\bservices?\b/, '/services', 'the Services page'],
    [/industr/, '/industries', 'the Industries page'],
    [/\bproducts?\b|\bcatalog(ue)?\b/, '/products', 'the Products catalogue'],
    [/\bprocess\b/, '/process', 'the Process page'],
    [/\bwhy.?us\b/, '/why-us', 'the Why Us page'],
    [/review|testimonial/, '/testimonials', 'the Reviews page'],
    [/\bquote\b/, '/quote', 'the Quote Request page'],
    [/\bcontact\b/, '/contact', 'the Contact page'],
  ]
  for (const [re, path, label] of navMap) {
    if (re.test(q) && /\b(show|take|go|open|see|visit|where|find|browse)\b/.test(q)) {
      return {
        text: pick([
          `Taking you to ${label} right away! 👉`,
          `On it — heading to ${label} now 🧭`,
          `${label.charAt(0).toUpperCase() + label.slice(1)}, coming up! 👉`,
        ]),
        cards: [{ name: label.replace('the ', ''), desc: '', to: path }],
        chips: ['What do you supply?', 'Talk to a human'],
      }
    }
  }

  /* product search — confident match gets product cards,
     weak match asks a clarifying question instead of pretending certainty */
  const results = findProducts(rawInput)
  const strong = results.filter((r) => r.score >= 3)
  const weak = results.filter((r) => r.score < 3)

  if (strong.length > 0) {
    return {
      text: pick(PRODUCT_INTROS),
      cards: strong.map((r) => r.card),
      chips: ['Show more services', 'Talk to a human'],
    }
  }
  if (weak.length > 0) {
    return {
      text: `Just to check — were you looking for something like this? 🤔\n\nIf not, describe it in a bit more detail and I'll dig deeper:`,
      cards: weak.map((r) => r.card),
      chips: ['Browse all products', 'Custom sourcing', 'Talk to a human'],
    }
  }

  /* custom sourcing fallback when product-ish */
  if (/\b(find|source|supply|stock|sell|buy|need|looking|get)\b/.test(q)) {
    return {
      text: pick([
        `I couldn't find that in our standard catalogue — but that's exactly what our **Custom Sourcing** service is for! If it exists, we'll track it down, negotiate pricing and deliver it.\n\nTell us the specification via the [custom request form](/quote?category=custom-sourcing) and get a quote within 24 hours.`,
        `Not in the regular catalogue, I'm afraid — but "no" isn't really our answer 😉 Send the spec through our [custom request form](/quote?category=custom-sourcing) and our sourcing team will hunt it down for you. Quotes land within 24 hours.`,
      ]),
      chips: ['Browse all products', 'Talk to a human'],
    }
  }

  /* fallback */
  return {
    text: pick(FALLBACKS),
    cards: [{ name: 'Chat with us on WhatsApp', desc: 'Speak to a real person instantly', to: CONTACT.whatsappLink, external: true }],
    chips: ['What do you supply?', 'How does quoting work?', 'Contact details'],
  }
}

/* ---------------- Optional LLM (Gemini via edge function) enhancement ---------------- */

const SYSTEM_PROMPT = `You are the GNAB Assistant for GNAB Business Solutions, a Ghanaian procurement & supply company.
Facts: Email ${CONTACT.email}; Phone ${CONTACT.phone}; WhatsApp ${CONTACT.whatsapp}; Address ${CONTACT.address}. Hours Mon-Fri 8am-5pm GMT.
Catalogues: Office Stationery & Consumables; IT Equipment & Accessories; Cleaning & Janitorial Supplies; PPE & Safety; Office Furniture; Printing & Branding; Electrical Materials; Custom Sourcing.
Pages: / (home), /about, /services, /industries, /products, /process, /why-us, /testimonials, /contact, /quote, /supplier-registration.
Rules: Sound warm and human, like a friendly sales assistant — vary your phrasing between messages, never repeat stock sentences. Be concise (under 120 words). Use markdown bold. To link internally use [label](/path). Recommend requesting a quote for pricing questions. Never invent prices.`

async function geminiReply(history: ChatMessage[]): Promise<Reply | null> {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: {
        systemInstruction: SYSTEM_PROMPT,
        contents: history.slice(-10).map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
      },
    })
    if (error) return null
    const text = (data as { text?: string | null } | null)?.text
    return text ? { text } : null
  } catch {
    return null
  }
}

/** Main entry: FAQ → LLM → local brain, with unanswered logging */
export async function getAssistantReply(
  input: string,
  history: ChatMessage[]
): Promise<ChatMessage> {
  // 1. Check admin-curated FAQ first — if admin has answered a similar question, use it verbatim
  try {
    const faqs = await fetchPublishedFaqs()
    const hit = findFaqMatch(input, faqs)
    if (hit) {
      return { id: uid(), role: 'bot', time: Date.now(), text: hit.answer, chips: ['Talk to a human', 'Ask another question'] }
    }
  } catch {
    /* ignore */
  }

  const llm = await geminiReply([...history, { id: uid(), role: 'user', text: input, time: Date.now() }])
  const reply = llm ?? localBrain(input)

  // 2. If we fell back to a generic fallback, give a *relevant* generic answer first, then log for admin
  const isFallback = FALLBACKS.includes(reply.text)
  if (isFallback) {
    // Fire-and-forget — don't block the reply
    void logUnansweredQuestion(input)
    const relevant = buildRelevantGeneric(input)
    const enhanced: Reply = {
      ...relevant,
      text: `${relevant.text}\n\n*Your question has been sent to our team — an admin will provide an answer soon, and I'll be able to answer it precisely next time you ask.*`,
    }
    return { id: uid(), role: 'bot', time: Date.now(), ...enhanced }
  }

  return { id: uid(), role: 'bot', time: Date.now(), ...reply }
}

export const makeUserMessage = (text: string): ChatMessage => ({
  id: uid(),
  role: 'user',
  text,
  time: Date.now(),
})
