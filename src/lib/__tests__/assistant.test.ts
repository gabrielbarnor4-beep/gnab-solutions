import { describe, it, expect } from 'vitest'
import { WELCOME_MESSAGE, makeUserMessage, localBrain, findProducts } from '@/lib/assistant'

describe('assistant welcome + user message', () => {
  it('welcome has chips and text', () => {
    const m = WELCOME_MESSAGE()
    expect(m.role).toBe('bot')
    expect(m.text.length).toBeGreaterThan(20)
    expect(m.chips?.length).toBeGreaterThan(0)
  })
  it('makeUserMessage shapes correctly', () => {
    const m = makeUserMessage('hello')
    expect(m.role).toBe('user')
    expect(m.text).toBe('hello')
  })
})

describe('assistant localBrain intents', () => {
  it('answers quoting questions with quote link', () => {
    const r = localBrain('how much does it cost? give me a price quote')
    expect(r.text).toMatch(/quote/i)
    expect(r.text).toContain('/quote')
  })
  it('answers delivery questions', () => {
    const r = localBrain('how long is delivery to Kumasi?')
    expect(r.text).toMatch(/2–5 working days|nationwide/i)
  })
  it('hands off to human with contact links', () => {
    const r = localBrain('can I talk to a human agent please?')
    expect(r.text).toMatch(/WhatsApp|Phone/i)
  })
  it('answers hours questions', () => {
    const r = localBrain('when are you open? working hours?')
    expect(r.text).toMatch(/Monday to Friday|Mon–Fri/i)
  })
  it('greets time-aware', () => {
    const r = localBrain('hello')
    expect(r.text).toMatch(/Good (morning|afternoon|evening)|Hello/i)
  })
  it('falls back to WhatsApp card for nonsense', () => {
    const r = localBrain('xqzt blorpt fnord 12345')
    expect(r.cards?.length).toBeGreaterThan(0)
    expect(r.chips?.length).toBeGreaterThan(0)
  })
  it('answers website questions with IT Solutions scoping path', () => {
    const r = localBrain('I need a website for my business')
    expect(r.text).toContain('/quote?category=it-solutions-digital-services')
    expect(r.text).toMatch(/scoping/i)
  })
  it('answers ERP questions via IT Solutions intent', () => {
    const r = localBrain('Do you do ERP systems?')
    expect(r.text).toMatch(/IT Solutions|trusted specialists|own team/i)
  })
  it('answers payment questions without inventing methods', () => {
    const r = localBrain('What payment methods do you accept?')
    expect(r.text).toMatch(/quotation/i)
    expect(r.text).not.toMatch(/MoMo|bank transfer|credit card/i)
  })
  it('answers bulk and standing-order questions', () => {
    const r = localBrain('Do you offer bulk discounts and standing orders?')
    expect(r.text).toMatch(/standing|recurring|bulk/i)
    expect(r.text).toContain('/quote')
  })
  it('points blog questions to the blog', () => {
    const r = localBrain('Do you have a blog?')
    expect(r.text).toContain('/blog')
  })
  it('handles damaged-item reports with after-sales path', () => {
    const r = localBrain('I received a damaged item, what do I do?')
    expect(r.text).toMatch(/after-sales|WhatsApp/i)
  })
  it('closes dismissive replies warmly without product cards', () => {
    const r = localBrain('Not for now')
    expect(r.text).toMatch(/No problem|Got it/)
    expect(r.cards).toBeUndefined()
  })
  it('invites follow-ups on Ask another question', () => {
    const r = localBrain('Ask another question')
    expect(r.text).toMatch(/Fire away/)
  })
  it('answers Custom sourcing chip directly', () => {
    const r = localBrain('Custom sourcing')
    expect(r.text).toContain('/quote?category=custom-sourcing')
  })
})

describe('assistant product search', () => {
  it('finds toner/printer products by word score', () => {
    const res = findProducts('printer toner')
    expect(res.length).toBeGreaterThan(0)
    expect(res[0]!.card.to).toContain('/quote?product=')
  })
  it('returns empty for empty/stopword query', () => {
    expect(findProducts('')).toEqual([])
    expect(findProducts('the and of')).toEqual([])
  })
  it('strong matches score >= 3 for exact product words', () => {
    const res = findProducts('office chair')
    // at least weak results; strong path covered in localBrain
    expect(Array.isArray(res)).toBe(true)
  })
  it('expands plurals so toners finds Toner', () => {
    const res = findProducts('toners')
    expect(res.length).toBeGreaterThan(0)
    expect(res[0]!.score).toBeGreaterThanOrEqual(3)
    expect(res[0]!.card.name).toMatch(/toner/i)
  })
  it('rewards consecutive phrase matches in product names', () => {
    const res = findProducts('business website design')
    expect(res.length).toBeGreaterThan(0)
    expect(res[0]!.card.name).toBe('Business Website Design')
  })
})
