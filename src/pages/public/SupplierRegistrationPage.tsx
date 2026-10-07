import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Handshake, Send } from 'lucide-react'
import { canSubmit, FORMSPREE_ENDPOINT, isAllowedAttachment, isHoneypotFilled, recordSubmit, formStr} from '@/lib/utils'
import { setPageMeta, useSiteSettings } from '@/lib/siteData'
import { supabase } from '@/lib/supabase'
import { Button, Field, PageHero, Reveal, inputClass } from '@/components/ui'

const CATEGORIES = [
  'Stationery', 'IT Equipment', 'Cleaning Supplies', 'PPE & Safety',
  'Furniture', 'Electrical', 'Automobile', 'IT Solutions', 'Agro & Foodstuffs', 'Printing & Branding', 'General Supplies', 'Other',
]

export default function SupplierRegistrationPage() {
  const s = useSiteSettings()
  useEffect(() => {
    setPageMeta('Supplier Registration | GNAB Business Solutions', 'Join our trusted network of suppliers and gain access to procurement opportunities across Ghana.')
  }, [])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  const toggleCat = (cat: string) =>
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    if (isHoneypotFilled(data)) return
    if (!canSubmit('supplier', 3)) { setError('Too many requests — please wait a minute.'); return }
    if (formStr(data, 'company_description').length > 5000) { setError('Description too long (max 5000).'); return }
    if (files.length > 5) { setError('Too many files (max 5).'); return }
    for (const f of files) {
      if (!isAllowedAttachment(f)) { setError(`File type not allowed: ${f.name}`); return }
      if (f.size > 5 * 1024 * 1024) { setError(`File too large: ${f.name} (max 5MB)`); return }
    }
    setLoading(true)
    setError('')
    data.set('supply_categories', selectedCats.join(', '))

    // Upload attachments
    let attachmentUrls: string[] = []
    if (files.length > 0) {
      for (const file of files) {
        const path = `suppliers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: upErr } = await supabase.storage.from('attachments').upload(path, file)
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)
          attachmentUrls.push(urlData.publicUrl)
        }
      }
    }

    // Store in Supabase for the admin supplier pipeline (Formspree still emails the team)
    try {
      await supabase.from('suppliers').insert({
        company_name: formStr(data, 'company_name'),
        contact_person: formStr(data, 'contact_person'),
        email: formStr(data, 'email'),
        phone: formStr(data, 'phone'),
        whatsapp: formStr(data, 'whatsapp') || null,
        business_address: formStr(data, 'business_address') || null,
        website: formStr(data, 'website') || null,
        registration_number: formStr(data, 'registration_number') || null,
        tin_number: formStr(data, 'tin_number') || null,
        category: selectedCats[0] ?? null,
        categories_supplied: selectedCats,
        products_services: formStr(data, 'products_supplied') || null,
        years_in_business: formStr(data, 'years_in_business') || null,
        areas_of_operation: formStr(data, 'areas_of_operation') || null,
        description: formStr(data, 'company_description') || null,
        attachment_urls: attachmentUrls,
      })
    } catch {
      /* pipeline save is best-effort — Formspree delivery must not be blocked */
    }

    try {
      if (attachmentUrls.length > 0) data.set('attachment_urls', attachmentUrls.join('\n'))
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        recordSubmit('supplier')
        setSubmitted(true)
        form.reset()
        setSelectedCats([])
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
        eyebrow="Partner With Us"
        title={<>{(s.supplier_hero_title || 'Become a GNAB Supplier').replace(s.supplier_hero_title_highlight || 'GNAB Supplier', '').trim()} <span className="text-gradient-gold">{s.supplier_hero_title_highlight || 'GNAB Supplier'}</span></>}
        subtitle={s.supplier_hero_subtitle || 'Join our trusted network of suppliers and gain access to procurement opportunities across Ghana.'}
      />

      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-gray-100 bg-white p-12 text-center shadow-soft"
            >
              <CheckCircle2 size={64} strokeWidth={1.4} className="text-brand-green-500" />
              <h3 className="mt-7 font-display text-2xl font-bold text-navy">Application Received</h3>
              <p className="mt-4 max-w-md leading-relaxed text-ink-light">
                Thank you for your interest in partnering with GNAB Business Solutions.
                Our supplier relations team will review your application and contact you shortly.
              </p>
              <button onClick={() => setSubmitted(false)} className="mt-8 text-sm font-semibold text-brand-green-600 hover:underline">
                Submit another application
              </button>
            </motion.div>
          ) : (
            <>
              <Reveal className="mb-10 text-center">
                <Handshake size={44} strokeWidth={1.5} className="mx-auto text-gold-500" />
                <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-light">
                  {s.supplier_intro_desc || 'Tell us about your business and the products or services you supply. Applications are reviewed within five working days.'}
                </p>
              </Reveal>

              <Reveal delay={0.1}>
                <form onSubmit={handleSubmit} className="grid gap-6 rounded-[32px] border border-gray-100 bg-white p-8 shadow-lift md:grid-cols-2 md:p-11">
                  <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                  <Field label="Company Name" required>
                    <input type="text" name="company_name" required className={inputClass} placeholder="Registered business name" />
                  </Field>
                  <Field label="Contact Person" required>
                    <input type="text" name="contact_person" required className={inputClass} placeholder="Full name" />
                  </Field>
                  <Field label="Email" required>
                    <input type="email" name="email" required className={inputClass} placeholder="business@company.com" />
                  </Field>
                  <Field label="Phone" required>
                    <input type="tel" name="phone" required className={inputClass} placeholder="+233 ..." />
                  </Field>
                  <Field label="WhatsApp">
                    <input type="tel" name="whatsapp" className={inputClass} placeholder="+233 ..." />
                  </Field>
                  <Field label="Website">
                    <input type="url" name="website" className={inputClass} placeholder="https://" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Business Address" required>
                      <input type="text" name="business_address" required className={inputClass} placeholder="Street, city, region" />
                    </Field>
                  </div>
                  <Field label="Business Registration No.">
                    <input type="text" name="registration_number" className={inputClass} placeholder="If available" />
                  </Field>
                  <Field label="TIN / Tax ID">
                    <input type="text" name="tin_number" className={inputClass} placeholder="Tax identification number" />
                  </Field>
                  <Field label="Years in Business">
                    <select name="years_in_business" defaultValue="" className={`${inputClass} appearance-none`}>
                      <option value="" disabled>Select</option>
                      <option>Less than 1 year</option>
                      <option>1 – 3 years</option>
                      <option>3 – 5 years</option>
                      <option>5 – 10 years</option>
                      <option>Over 10 years</option>
                    </select>
                  </Field>
                  <Field label="Areas of Operation">
                    <input type="text" name="areas_of_operation" className={inputClass} placeholder="e.g., Greater Accra, Ashanti" />
                  </Field>

                  {/* Categories */}
                  <fieldset className="md:col-span-2">
                    <legend className="mb-3 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
                      Categories You Supply <span className="text-brand-green-500">*</span>
                    </legend>
                    <div className="flex flex-wrap gap-2.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCat(cat)}
                          aria-pressed={selectedCats.includes(cat)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                            selectedCats.includes(cat)
                              ? 'border-brand-green-500 bg-brand-green-500 text-white shadow'
                              : 'border-gray-200 bg-mist text-ink-light hover:border-navy-300 hover:text-navy'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="md:col-span-2">
                    <Field label="Products / Services Supplied" required>
                      <textarea name="products_supplied" rows={4} required className={`${inputClass} resize-none`} placeholder="List your main products or services..." />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Brief Company Description">
                      <textarea name="company_description" rows={3} className={`${inputClass} resize-none`} placeholder="A short overview of your company..." />
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
                      <Send size={17} /> Submit Application
                    </Button>
                  </div>
                </form>
              </Reveal>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
