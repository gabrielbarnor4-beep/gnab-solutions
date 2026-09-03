import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { IMAGES } from '@/lib/utils'
import { ButtonLink, PageHero, PremiumCTA } from '@/components/ui'
import { fetchPublicProcessSteps, setPageMeta, useSiteImage, useSiteSettings } from '@/lib/siteData'

const FALLBACK_STEPS: { num: string; title: string; desc: string; points: string[]; image: string }[] = [
  {
    num: '01',
    title: 'Receive Request',
    desc: 'Your enquiry opens the file. Reach us however suits you — our quote form, phone, email or WhatsApp — and a dedicated procurement officer takes it from there.',
    points: [
      'Requirements captured in full: item specifications, quantities, brands and your deadline',
      'Receipt confirmed within hours, with follow-up questions to close any gaps',
      'Urgent requests flagged for same-day sourcing',
    ],
    image: IMAGES.signing,
  },
  {
    num: '02',
    title: 'Source Products',
    desc: 'Behind the scenes, we put your requirement to work across our vetted network of 100+ suppliers — locally and internationally — comparing options you would spend days finding yourself.',
    points: [
      'Multiple suppliers queried in parallel on quality, availability and price',
      'Genuine products only — every source is verified before it enters your quotation',
      'Smarter alternatives suggested where they offer better value or availability',
    ],
    image: IMAGES.sourcing,
  },
  {
    num: '03',
    title: 'Prepare Quotation',
    desc: 'Within 24 hours of your request, a clear written quotation lands with you — built to be understood at a glance by you, your finance team and your auditors.',
    points: [
      'Fully itemised pricing — unit costs, quantities, taxes, no hidden fees',
      'Exact specifications and a committed delivery timeline included',
      'Clear validity period, so prices are locked while you decide',
    ],
    image: IMAGES.about2,
  },
  {
    num: '04',
    title: 'Client Approval',
    desc: 'The decision stays entirely yours. Review the quotation at your own pace while we remain on hand to adjust anything until the order is exactly right.',
    points: [
      'Questions answered and specifications fine-tuned on request',
      'Revised quotes issued quickly if scope or quantities change',
      'Nothing is ordered until you give the explicit go-ahead',
    ],
    image: IMAGES.handshake,
  },
  {
    num: '05',
    title: 'Delivery',
    desc: 'Approval triggers immediate dispatch. Our logistics team coordinates the journey from warehouse to your doorstep anywhere in Ghana — and keeps you informed until it is done.',
    points: [
      'Prompt dispatch with tracking and status updates through transit',
      'Nationwide coverage — standard items arrive within 2–5 working days',
      'Orders verified complete and intact at every handover before sign-off',
    ],
    image: IMAGES.delivery,
  },
  {
    num: '06',
    title: 'After-Sales Support',
    desc: 'Delivery ends the order, not the relationship. Your account manager stays available for anything that follows — and makes your next order even easier than the first.',
    points: [
      'Warranty claims, replacements and returns handled entirely by us',
      'Priority processing and re-order reminders for repeat purchases',
      'Periodic account reviews to sharpen pricing and service over time',
    ],
    image: IMAGES.teamwork,
  },
]

const FALLBACK_GUARANTEE: [string, string][] = [
  ['24 Hours', 'Quotation turnaround'],
  ['100%', 'Order accuracy commitment'],
  ['Dedicated', 'Account manager support'],
]

export default function ProcessPage() {
  const s = useSiteSettings()
  const heroImg = useSiteImage('process_hero', IMAGES.warehouse)
  const [live, setLive] = useState<(typeof FALLBACK_STEPS[number] & { image: string })[] | null>(null)
  useEffect(() => {
    setPageMeta('Our Process | GNAB Business Solutions', 'Six transparent steps from your first request to lasting after-sales support.')
    void fetchPublicProcessSteps().then((rows) => {
      if (rows.length > 0) setLive(rows.map((r) => ({ num: r.step_number, title: r.title, desc: r.description ?? '', points: r.points ?? [], image: r.image_url ?? IMAGES.signing })))
    })
  }, [])
  const display = live ?? FALLBACK_STEPS
  const guarantee: [string, string][] = (() => {
    try {
      const parsed = JSON.parse(s.process_guarantee || '[]')
      if (Array.isArray(parsed) && parsed.length) return parsed.map((g: any) => [g.value ?? g[0], g.label ?? g[1]] as [string,string])
      return FALLBACK_GUARANTEE
    } catch { return FALLBACK_GUARANTEE }
  })()
  return (
    <div>
      <PageHero
        eyebrow="How It Works"
        title={<>{(s.process_hero_title || 'A Procurement Process Built on Clarity').replace(s.process_hero_title_highlight || 'Clarity', '').trim()} <span className="text-gradient-gold">{s.process_hero_title_highlight || 'Clarity'}</span></>}
        subtitle={s.process_hero_subtitle || 'Six transparent steps from your first request to lasting after-sales support.'}
        image={heroImg}
      />

      {/* Vertical premium timeline — elevated, still vertical */}
      <section className="relative bg-mist py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/60" aria-hidden />
        <div className="absolute left-1/2 top-0 h-px w-[80%] max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="absolute bottom-24 left-10 top-24 w-px bg-gradient-to-b from-gold-400 via-gold-400/35 to-transparent md:left-[54px]" aria-hidden />
          <ol className="relative space-y-10">
            {display.map((step, i) => (
              <motion.li
                key={step.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                className="group relative"
              >
                <div className="relative flex gap-6 sm:gap-8">
                  {/* Premium node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-lift ring-4 ring-white transition-transform duration-300 group-hover:scale-[1.03] md:h-24 md:w-24 md:rounded-3xl">
                      <img
                        src={(step as unknown as { image: string }).image}
                        alt={step.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/15 to-transparent" aria-hidden />
                    </div>
                    <span className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-amber-500 font-display text-xs font-extrabold text-navy shadow-lg ring-2 ring-white">
                      {step.num}
                    </span>
                    {i < display.length - 1 && <span className="absolute left-1/2 top-[84px] hidden h-6 w-px -translate-x-1/2 bg-gold-400/20 md:top-[104px] md:block" aria-hidden />}
                  </div>

                  {/* Premium card */}
                  <div className="group/card relative flex-1 overflow-hidden rounded-[24px] border border-gray-100 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-navy-100 hover:shadow-lift md:p-8">
                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold-400 via-amber-400 to-gold-400 opacity-90" aria-hidden />
                    <div className="absolute -right-6 -top-6 select-none font-display text-[84px] font-extrabold leading-none text-navy/[0.035]" aria-hidden>
                      {step.num}
                    </div>
                    <div className="relative">
                      <span className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-navy">
                        Step {step.num}
                      </span>
                      <h3 className="mt-3 font-display text-xl font-bold leading-tight text-navy">{step.title}</h3>
                      <p className="mt-3 text-[15px] leading-relaxed text-ink-light">{step.desc}</p>
                      <ul className="mt-6 space-y-3">
                        {(step.points ?? []).map((point: string) => (
                          <li key={point} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-green-50 text-brand-green-600">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span className="text-[14px] leading-relaxed text-ink">{point}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-light">
                          {i === 0 ? 'Starts with your enquiry' : `Follows Step ${display[i - 1]!.num}`}
                        </span>
                        {i === display.length - 1 && <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green-50 px-3 py-1 text-xs font-bold text-brand-green-600 ring-1 ring-brand-green-200">Ongoing support</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-14 text-center"
          >
            <ButtonLink to="/quote" size="lg">
              Start Step One Now <ArrowRight size={18} />
            </ButtonLink>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-light">Six steps · One partner · Endless solutions</p>
          </motion.div>
        </div>
      </section>

      {/* guarantee strip — premium */}
      <section className="bg-mist py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-[1.5px] shadow-soft">
            <div className="rounded-[30px] bg-white p-10 md:p-14">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-400 via-amber-400 to-gold-400 opacity-80" aria-hidden />
              <div className="grid gap-8 md:grid-cols-3">
                {guarantee.map(([v, l]) => (
                  <div key={l} className="text-center md:text-left">
                    <p className="font-display text-4xl font-extrabold text-navy">{v}</p>
                    <p className="mt-2 text-sm font-medium uppercase tracking-wide text-ink-light">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PremiumCTA
        eyebrow={s.process_cta_eyebrow || 'Start today'}
        title={s.process_cta_title || 'Ready to Start Step One?'}
            titleHighlight={s.process_cta_title_highlight}
            features={[s.process_cta_feature1, s.process_cta_feature2, s.process_cta_feature3]}
        subtitle={s.process_cta_subtitle || 'Tell us what you need — get a transparent quotation within 24 hours.'}
        primary={{ label: s.process_cta_primary_label || 'Request a Quote', to: '/quote' }}
        secondary={{ label: s.process_cta_secondary_label || 'Talk to Our Team', to: '/contact' }}
      />
    </div>
  )
}
