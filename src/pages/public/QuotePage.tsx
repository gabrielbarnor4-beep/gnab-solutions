import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Send, ShieldCheck, Timer, Wallet } from 'lucide-react'
import { ALLOWED_ATTACHMENT_EXTS, canSubmit, CONTACT, FORMSPREE_ENDPOINT, IMAGES, INDUSTRIES_LIST, isAllowedAttachment, isHoneypotFilled, PRODUCT_CATEGORIES, recordSubmit, formStr} from '@/lib/utils'
import { catalogueTitleForSlug, formatITProjectDetails, isAgroCategory, isITSolutionsCategory } from '@/lib/catalogue'
import { setPageMeta, useSiteSettings } from '@/lib/siteData'
import { supabase } from '@/lib/supabase'

import { Button, Field, PageHero, Reveal, inputClass } from '@/components/ui'

export default function QuotePage() {
  const s = useSiteSettings()
  useEffect(() => {
    setPageMeta('Request a Quote | GNAB Business Solutions', 'Tell us what you need — receive a competitive, transparent quotation within 24 hours.', IMAGES.hero2)
  }, [])
  const [params] = useSearchParams()
  const catParam = params.get('category') ?? ''
  // Resolve any slug/title variant (e.g. "automobile-services-spares",
  // "Automobile Services & Spares", "automobile-services") to the exact
  // PRODUCT_CATEGORIES title so the dropdown always pre-selects correctly.
  const prefillCategory = catParam ? catalogueTitleForSlug(catParam, PRODUCT_CATEGORIES) : ''
  const prefillProduct = params.get('product') ?? ''
  const [selectedCategory, setSelectedCategory] = useState(prefillCategory)
  // Keep in sync when navigating between product → quote links without remount.
  useEffect(() => { if (prefillCategory) setSelectedCategory(prefillCategory) }, [prefillCategory])
  // IT Solutions quotes carry project scope instead of looking like goods orders.
  const isITService = isITSolutionsCategory(selectedCategory)
  // Agro quotes get an intermediary reassurance so farm-produce buyers trust a non-farm seller.
  const isAgro = isAgroCategory(selectedCategory)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    if (isHoneypotFilled(fd)) return
    if (!canSubmit('quote', 5)) { setError('Too many requests — please wait a minute.'); return }
    // IT Solutions RFQs must carry a scope so they read as service enquiries, not goods orders
    const itBlock = isITService
      ? formatITProjectDetails({ scope: formStr(fd, 'it_scope'), current: formStr(fd, 'it_current'), users: formStr(fd, 'it_users'), timeline: formStr(fd, 'it_timeline') })
      : ''
    if (isITService && !itBlock) { setError('Please describe your project scope so we can prepare an accurate proposal.'); return }
    const requirementText = formStr(fd, 'products_or_services') + (itBlock ? `\n\n${itBlock}` : '')
    if (requirementText.length > 5000 || formStr(fd, 'message').length > 5000) { setError('Message too long (max 5000).'); return }
    if (files.length > 5) { setError('Too many files (max 5).'); return }
    for (const f of files) {
      if (!isAllowedAttachment(f)) { setError(`File type not allowed: ${f.name}. Allowed: ${[...ALLOWED_ATTACHMENT_EXTS].join(', ')}`); return }
      if (f.size > 5 * 1024 * 1024) { setError(`File too large: ${f.name} (max 5MB)`); return }
    }
    setLoading(true)
    setError('')

    // Upload attachments first
    let attachmentUrls: string[] = []
    if (files.length > 0) {
      for (const file of files) {
        const path = `quotes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: upErr } = await supabase.storage.from('attachments').upload(path, file)
        if (!upErr) {
          const { data } = supabase.storage.from('attachments').getPublicUrl(path)
          attachmentUrls.push(data.publicUrl)
        }
      }
    }

    // Store in Supabase for the admin RFQ pipeline (Formspree still emails the team)
    // Retry on RFQ number collision (unique constraint 23505)
    const basePayload = {
      full_name: formStr(fd, 'full_name'),
      company_name: formStr(fd, 'company_name') || null,
      email: formStr(fd, 'email'),
      phone: formStr(fd, 'phone'),
      whatsapp: formStr(fd, 'whatsapp') || null,
      industry: formStr(fd, 'industry') || null,
      product_category: selectedCategory || null,
      products_or_services: requirementText,
      quantity: formStr(fd, 'quantity') || null,
      delivery_location: formStr(fd, 'delivery_location') || null,
      message: formStr(fd, 'message') || null,
      attachment_urls: attachmentUrls,
    }
    const makeRfq = () => `GNAB-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: insErr } = await supabase.from('quote_requests').insert({ ...basePayload, rfq_number: makeRfq() })
      if (!insErr) break
      // 23505 = unique_violation (collision) — retry; other errors are best-effort so stop
      if (insErr.code !== '23505' || attempt === 2) break
    }

    try {
      const formFd = new FormData(form)
      if (attachmentUrls.length > 0) formFd.set('attachment_urls', attachmentUrls.join('\n'))
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formFd,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        recordSubmit('quote')
        setSubmitted(true)
        form.reset()
        setFiles([])
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError('Something went wrong while submitting. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHero
        eyebrow="Request a Quote"
        title={<>{(s.quote_hero_title || 'Get Your Free Quotation').replace(s.quote_hero_title_highlight || 'Free Quotation', '').trim()} <span className="text-gradient-gold">{s.quote_hero_title_highlight || 'Free Quotation'}</span></>}
        subtitle={s.quote_hero_subtitle || 'Tell us what you need — receive a competitive, transparent quotation within 24 hours.'}
        image={IMAGES.hero2}
      />

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            {/* Side panel */}
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-navy">{s.quote_how_it_works_title || 'How It Works'}</h2>
              <ol className="mt-9 space-y-7">
                {[
                  ['Submit the form', 'Share your requirements in under two minutes.'],
                  ['We source & price', 'Our team negotiates with vetted suppliers for you.'],
                  ['Receive your quote', 'A clear quotation lands in your inbox within 24 hours.'],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-5">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-gold-400">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-navy">{t}</h3>
                      <p className="mt-1 text-[15px] leading-relaxed text-ink-light">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-12 space-y-4">
                {[
                  { icon: Timer, t: '24-hour response guarantee' },
                  { icon: Wallet, t: 'Transparent pricing, no hidden fees' },
                  { icon: ShieldCheck, t: 'Quality assured on every order' },
                ].map((f) => (
                  <div key={f.t} className="flex items-center gap-3.5 rounded-2xl border border-gray-100 bg-mist px-5 py-4">
                    <f.icon size={20} className="flex-shrink-0 text-brand-green-500" />
                    <span className="text-[15px] font-medium text-navy">{f.t}</span>
                  </div>
                ))}
              </div>

              {isAgro && (
                <div className="mt-4 rounded-2xl border border-brand-green-200 bg-brand-green-50 px-5 py-4">
                  <p className="text-[15px] font-semibold text-navy">Buying farm produce through GNAB</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-light">
                    Farm-gate sourcing · quality-checked before dispatch · export-packed with documentation — delivered anywhere in Ghana or worldwide.
                  </p>
                </div>
              )}

              <p className="mt-10 text-[15px] leading-relaxed text-ink-light">
                Prefer to talk? Call us at{' '}
                <a href={`tel:${CONTACT.phoneRaw}`} className="font-semibold text-navy hover:text-brand-green-600">
                  {CONTACT.phone}
                </a>{' '}
                or{' '}
                <a href={CONTACT.whatsappLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-green-600 hover:underline">
                  chat on WhatsApp
                </a>
                .
              </p>
            </Reveal>

            {/* Form card */}
            <Reveal delay={0.1}>
              <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-lift md:p-11">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex min-h-[520px] flex-col items-center justify-center text-center"
                  >
                    <CheckCircle2 size={72} strokeWidth={1.3} className="text-brand-green-500" />
                    <h3 className="mt-8 max-w-md font-display text-2xl font-bold leading-snug text-navy">
                      Thank you for contacting GNAB Business Solutions.
                    </h3>
                    <p className="mt-4 max-w-sm leading-relaxed text-ink-light">
                      Your quotation request has been received and we will respond as soon as possible.
                    </p>
                    <button onClick={() => setSubmitted(false)} className="mt-8 text-sm font-semibold text-brand-green-600 hover:underline">
                      Submit another request
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="font-display text-2xl font-bold text-navy">{s.quote_form_title || 'Your Request Details'}</h3>
                    <form onSubmit={handleSubmit} className="mt-8 grid gap-6 md:grid-cols-2">
                      <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                      <Field label="Full Name" required>
                        <input type="text" name="full_name" required placeholder="Your full name" className={inputClass} />
                      </Field>
                      <Field label="Company Name">
                        <input type="text" name="company_name" placeholder="Your organisation" className={inputClass} />
                      </Field>
                      <Field label="Email" required>
                        <input type="email" name="email" required placeholder="you@company.com" className={inputClass} />
                      </Field>
                      <Field label="Phone" required>
                        <input type="tel" name="phone" required placeholder="+233 ..." className={inputClass} />
                      </Field>
                      <Field label="WhatsApp Number">
                        <input type="tel" name="whatsapp" placeholder="+233 ..." className={inputClass} />
                      </Field>
                      <Field label="Industry" required>
                        <select name="industry" required defaultValue="" className={`${inputClass} appearance-none`}>
                          <option value="" disabled>Select your industry</option>
                          {INDUSTRIES_LIST.map((i) => <option key={i}>{i}</option>)}
                        </select>
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Product Category" required>
                          <select name="product_category" required value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`${inputClass} appearance-none`}>
                            <option value="" disabled>What do you need sourced?</option>
                            {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            {selectedCategory && !(PRODUCT_CATEGORIES as readonly string[]).includes(selectedCategory) && (
                              <option value={selectedCategory}>{selectedCategory}</option>
                            )}
                          </select>
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Products or Services Required" required>
                          <textarea
                            name="products_or_services"
                            rows={4}
                            required
                            defaultValue={prefillProduct}
                            placeholder={isITService ? 'Briefly list what you need — e.g., company website rebuild + maintenance...' : 'Describe exactly what you need — item types, specifications, brands...'}
                            className={`${inputClass} resize-none`}
                          />
                        </Field>
                      </div>
                      {isITService && (
                        <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-5 md:col-span-2">
                          <p className="font-display text-sm font-bold text-navy">About your project</p>
                          <p className="mt-1 text-xs text-ink-light">Digital work is scoped, not shipped — these details let us prepare an accurate proposal.</p>
                          <div className="mt-4">
                            <Field label="Project Scope" required>
                              <textarea
                                name="it_scope"
                                rows={3}
                                required
                                placeholder="What should be built or set up? Key pages, features, systems involved..."
                                className={`${inputClass} resize-none`}
                              />
                            </Field>
                          </div>
                          <div className="mt-6 grid gap-6 md:grid-cols-2">
                            <Field label="Current Website / System">
                              <input type="text" name="it_current" placeholder="e.g., none yet, www.example.com, Tally..." className={inputClass} />
                            </Field>
                            <Field label="Expected Users / Traffic">
                              <select name="it_users" defaultValue="" className={`${inputClass} appearance-none`}>
                                <option value="" disabled>Select a range</option>
                                <option>Up to 100 monthly users</option>
                                <option>100 – 1,000 monthly users</option>
                                <option>1,000 – 10,000 monthly users</option>
                                <option>10,000+ monthly users</option>
                                <option>Not sure yet</option>
                              </select>
                            </Field>
                            <Field label="Desired Timeline">
                              <select name="it_timeline" defaultValue="" className={`${inputClass} appearance-none`}>
                                <option value="" disabled>Select a timeline</option>
                                <option>As soon as possible</option>
                                <option>Within 1 month</option>
                                <option>1 – 3 months</option>
                                <option>Flexible / still exploring</option>
                              </select>
                            </Field>
                          </div>
                        </div>
                      )}
                      <Field label="Quantity">
                        <input type="text" name="quantity" placeholder="e.g., 50 units" className={inputClass} />
                      </Field>
                      <Field label="Preferred Delivery Location">
                        <input type="text" name="delivery_location" placeholder="City / region" className={inputClass} />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Additional Information">
                          <textarea name="message" rows={3} placeholder="Deadlines, budget range, special instructions..." className={`${inputClass} resize-none`} />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Attach Documents / Images (optional)">
                          <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="w-full rounded-xl border border-gray-200 bg-mist/60 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-600" />
                          {files.length > 0 && <p className="mt-2 text-xs text-ink-light">{files.length} file(s) selected: {files.map((f) => f.name).join(', ')}</p>}
                        </Field>
                      </div>

                      {error && (
                        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100 md:col-span-2">{error}</p>
                      )}

                      <div className="md:col-span-2">
                        <Button loading={loading} type="submit">
                          <Send size={17} /> Submit Quote Request
                        </Button>
                        <p className="mt-4 text-center text-xs text-gray-400">
                          By submitting, you agree to be contacted by GNAB Business Solutions regarding your request.
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  )
}
