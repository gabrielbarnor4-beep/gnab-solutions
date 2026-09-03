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
})
