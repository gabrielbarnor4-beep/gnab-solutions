import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Quote as QuoteIcon, Send, Star } from 'lucide-react'
import {
  fetchApprovedTestimonials,
  submitTestimonial,
  type PublicTestimonial,
} from '@/lib/testimonials'
import { canSubmit, IMAGES, isHoneypotFilled, recordSubmit, formStr} from '@/lib/utils'
import { setPageMeta, useSiteSettings } from '@/lib/siteData'
import { Button, Field, PageHero, Reveal, inputClass } from '@/components/ui'

function Stars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={i <= value ? 'fill-gold-400 text-gold-400' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

export default function TestimonialsPage() {
  const s = useSiteSettings()
  const [items, setItems] = useState<PublicTestimonial[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(5)

  useEffect(() => {
    setPageMeta('Testimonials | GNAB Business Solutions', 'Real feedback from the businesses and institutions we serve across Ghana.')
    void fetchApprovedTestimonials().then(setItems)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const fd = new FormData(form)
    if (isHoneypotFilled(fd)) return
    if (!canSubmit('testimonial', 3)) { setError('Too many reviews — please wait a minute.'); return }
    const quote = formStr(fd, 'quote')
    if (quote.length > 2000) { setError('Review too long (max 2000).'); return }
    if (quote.length < 20) { setError('Review too short (min 20).'); return }
    setLoading(true)
    try {
      await submitTestimonial({
        client_name: formStr(fd, 'client_name'),
        client_role: formStr(fd, 'client_role'),
        company: formStr(fd, 'company'),
        rating,
        quote,
      })
      recordSubmit('testimonial')
      setSubmitted(true)
      form.reset()
      setRating(5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHero
        eyebrow="Client Reviews"
        title={<>{(s.testimonials_hero_title || 'What Organisations Say About GNAB').replace(s.testimonials_hero_title_highlight || 'GNAB', '').trim()} <span className="text-gradient-gold">{s.testimonials_hero_title_highlight || 'GNAB'}</span></>}
        subtitle={s.testimonials_hero_subtitle || 'Real feedback from the businesses and institutions we serve across Ghana.'}
        image={IMAGES.hero3}
      />

      {/* Approved testimonials */}
      <section className="bg-mist py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((t) => (
              <motion.figure
                key={t.id}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="card-hover flex flex-col rounded-[28px] border border-gray-100 bg-white p-8 shadow-soft"
              >
                <QuoteIcon size={26} className="text-gold-400" />
                <blockquote className="mt-5 flex-1 text-[15.5px] leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <Stars value={t.rating} className="mt-5" />
                <figcaption className="mt-5 border-t border-gray-100 pt-4">
                  <p className="flex flex-wrap items-center gap-2 font-display font-bold text-navy">
                    {t.client_name}
                    {t.isSample && (
                      <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-light ring-1 ring-gray-200">
                        Sample
                      </span>
                    )}
                  </p>
                  {(t.client_role || t.company) && (
                    <p className="mt-0.5 text-sm text-ink-light">
                      {[t.client_role, t.company].filter(Boolean).join(', ')}
                    </p>
                  )}
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Submission form */}
      <section className="py-24" id="share">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10 text-center">
            <h2 className="font-display text-3xl font-bold text-navy md:text-4xl">{s.testimonials_share_title || 'Share Your Experience'}</h2>
            <p className="mt-4 leading-relaxed text-ink-light">
              Worked with us? Your feedback means everything. Submissions are reviewed by our
              team before being published on this page.
            </p>
          </Reveal>

          {submitted ? (
            <Reveal>
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[32px] border border-gray-100 bg-white p-12 text-center shadow-soft">
                <CheckCircle2 size={60} strokeWidth={1.4} className="text-brand-green-500" />
                <h3 className="mt-7 font-display text-2xl font-bold text-navy">Thank You!</h3>
                <p className="mt-4 max-w-md leading-relaxed text-ink-light">
                  Your testimonial has been received and is awaiting review. Once approved,
                  it will appear on this page.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-8 text-sm font-semibold text-brand-green-600 hover:underline">
                  Write another review
                </button>
              </div>
            </Reveal>
          ) : (
            <Reveal delay={0.1}>
              <form onSubmit={handleSubmit} className="grid gap-6 rounded-[32px] border border-gray-100 bg-white p-8 shadow-lift md:p-11">
                <input type="text" name="website_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <Field label="Your Name" required>
                  <input type="text" name="client_name" required placeholder="Full name" className={inputClass} />
                </Field>
                <Field label="Role / Position">
                  <input type="text" name="client_role" placeholder="e.g., Procurement Manager" className={inputClass} />
                </Field>
                <Field label="Company / Organisation">
                  <input type="text" name="company" placeholder="Where you work" className={inputClass} />
                </Field>

                <fieldset>
                  <legend className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
                    Your Rating <span className="text-brand-green-500">*</span>
                  </legend>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} stars`} className="rounded-lg p-1 transition-transform hover:scale-110">
                        <Star size={30} className={i <= rating ? 'fill-gold-400 text-gold-400' : 'text-gray-300'} />
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Field label="Your Review" required>
                  <textarea
                    name="quote"
                    rows={5}
                    required
                    minLength={20}
                    placeholder="Tell others about your experience with GNAB Business Solutions..."
                    className={`${inputClass} resize-none`}
                  />
                </Field>

                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100">{error}</p>
                )}

                <Button loading={loading} type="submit">
                  <Send size={17} /> Submit for Review
                </Button>
                <p className="-mt-2 text-center text-xs text-gray-400">
                  Reviews are moderated before publishing. We never edit your words.
                </p>
              </form>
            </Reveal>
          )}
        </div>
      </section>
    </div>
  )
}
