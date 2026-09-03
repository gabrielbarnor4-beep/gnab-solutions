import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Handshake,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react'
import { IMAGES } from '@/lib/utils'
import { ButtonLink, PageHero, PremiumCTA } from '@/components/ui'
import { fetchPublicWhy, setPageMeta, useSiteImage, useSiteSettings } from '@/lib/siteData'
import { ICON_MAP } from '@/lib/iconOptions'

interface Reason {
  icon: typeof Handshake
  title: string
  desc: string
  points: string[]
  image: string
  alt: string
}

const FALLBACK_REASONS: Reason[] = [
  {
    icon: Handshake,
    title: 'Reliable Supplier Network',
    desc: 'One call should be enough — and with us, it is. Our network of over 100 verified suppliers across Ghana and beyond means that whatever your organisation needs, we already know exactly where to get it.',
    points: [
      'Every supplier passes a vetting process covering quality, reliability, pricing and regulatory compliance',
      'Redundancy built in: if a source fails, we switch to an alternative without delays hitting your timeline',
      'Local and international sourcing for standard items as well as hard-to-find specifications',
      'Long-term supplier relationships unlock priority stock allocations during national shortages',
    ],
    image: IMAGES.about,
    alt: 'GNAB team meeting with supplier partners',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Procurement only counts when the goods actually arrive. Our logistics operation is built around your deadlines — not our convenience.',
    points: [
      'Standard items delivered within 2–5 working days of order approval, nationwide across Ghana',
      'Proactive status updates at dispatch, transit and delivery — you never have to chase us',
      'Bulk and multi-region orders coordinated from a single point of contact',
      'Careful handling and verification at every handover so orders arrive complete and intact',
    ],
    image: IMAGES.logistics,
    alt: 'Delivery truck on the road',
  },
  {
    icon: Wallet,
    title: 'Competitive Pricing',
    desc: 'Our purchasing power becomes your budget advantage. Because we buy in volume and negotiate daily, the prices you receive are simply unavailable to individual buyers.',
    points: [
      'Bulk purchasing power passed directly to you through lower unit costs',
      'Transparent quotations itemising every cost — no hidden fees, no surprise invoices',
      'We negotiate with multiple suppliers on your behalf so you always see the best available rate',
      'Framework pricing available for organisations with recurring monthly procurement needs',
    ],
    image: IMAGES.pricing,
    alt: 'Reviewing costs and pricing calculations',
  },
  {
    icon: Headphones,
    title: 'Professional Support',
    desc: 'You are assigned a dedicated account manager — a single, knowledgeable human being who owns your file end to end. No ticket queues, no starting from scratch with a stranger every time.',
    points: [
      'One consistent contact who learns your organisation, standards and recurring needs',
      'Quotations turned around within 24 hours, questions answered the same business day',
      'Proactive re-order reminders for consumables before you run out',
      'Support continues after delivery — replacements, warranty claims and follow-ups are handled for you',
    ],
    image: IMAGES.consultant,
    alt: 'Dedicated account manager assisting a client',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assurance',
    desc: 'Every item we deliver has passed through our checks before it reaches yours. Quality is not an inspection step for us — it is designed into how we select suppliers in the first place.',
    points: [
      'Supplier certifications and product authenticity verified before any contract is signed',
      'Goods inspected against agreed specifications before dispatch',
      'Certified and standards-compliant PPE, electrical and safety equipment',
      'If anything falls short of specification, we replace it — at no cost and no debate',
    ],
    image: IMAGES.warehouse,
    alt: 'Goods inspected in a warehouse before dispatch',
  },
  {
    icon: Sparkles,
    title: 'Tailored Solutions',
    desc: 'No two organisations procure alike. A hospital, a construction firm and an NGO may need overlapping products — but entirely different terms, timelines and documentation.',
    points: [
      'Custom procurement packages shaped around your operations, priorities and budget cycles',
      'Flexible arrangements: one-off purchases, scheduled deliveries or annual supply contracts',
      'Custom sourcing service tracks down items outside our catalogue — if it exists, we will find it',
      'Documentation and reporting formatted to satisfy auditors, donors and internal compliance teams',
    ],
    image: IMAGES.workshop,
    alt: 'Planning a tailored procurement package with a client team',
  },
]

// ICON_MAP now from @/lib/iconOptions (40+ icons)

export default function WhyUsPage() {
  const s = useSiteSettings()
  const [live, setLive] = useState<Reason[] | null>(null)
  const heroImg = useSiteImage('why_hero', IMAGES.hero1)
  useEffect(() => {
    setPageMeta('Why Choose Us | GNAB Business Solutions', 'Organisations across Ghana choose GNAB because we treat procurement as a partnership, not a transaction.')
    void fetchPublicWhy().then((rows) => {
      if (rows.length > 0) setLive(rows.map((r, i) => ({ icon: ICON_MAP[r.icon ?? ''] ?? Handshake, title: r.title, desc: r.description ?? '', points: FALLBACK_REASONS[i]?.points ?? [], image: r.image_url ?? FALLBACK_REASONS[i]?.image ?? IMAGES.about, alt: r.title })))
    })
  }, [])
  const display = live ?? FALLBACK_REASONS
  const typicalBullets: string[] = (() => {
    try {
      const parsed = JSON.parse(s.whyus_comparison_typical_bullets || '[]')
      if (Array.isArray(parsed) && parsed.length) return parsed
      return ['Multiple vendors to chase', 'Inconsistent pricing', 'Slow, unclear quotations', 'No accountability after delivery']
    } catch { return ['Multiple vendors to chase', 'Inconsistent pricing', 'Slow, unclear quotations', 'No accountability after delivery'] }
  })()
  const gnabBullets: string[] = (() => {
    try {
      const parsed = JSON.parse(s.whyus_comparison_gnab_bullets || '[]')
      if (Array.isArray(parsed) && parsed.length) return parsed
      return ['One partner for everything', 'Transparent, competitive pricing', 'Quotation within 24 hours', 'After-sales support that stays']
    } catch { return ['One partner for everything', 'Transparent, competitive pricing', 'Quotation within 24 hours', 'After-sales support that stays'] }
  })()
  return (
    <div>
      <PageHero
        eyebrow="Why GNAB"
        title={<>{(s.whyus_hero_title || 'More Than a Supplier — A Strategic Partner').replace(s.whyus_hero_title_highlight || 'Strategic Partner', '').trim()} <span className="text-gradient-gold">{s.whyus_hero_title_highlight || 'Strategic Partner'}</span></>}
        subtitle={s.whyus_hero_subtitle || 'Organisations across Ghana choose GNAB because we treat procurement as a partnership, not a transaction.'}
        image={heroImg}
      />

      {/* Alternating feature rows */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {display.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`grid items-center gap-10 md:gap-16 lg:grid-cols-2 ${i % 2 === 1 ? '' : ''}`}
            >
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <span className="font-display text-[88px] font-extrabold leading-none text-navy/[0.06]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="-mt-12 flex items-center gap-4">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-green-500 text-white shadow-lg shadow-green-900/25">
                    <r.icon size={26} />
                  </span>
                  <h3 className="font-display text-2xl font-bold text-navy md:text-[28px]">{r.title}</h3>
                </div>
                <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-ink-light">{r.desc}</p>
                <ul className="mt-6 max-w-xl space-y-3">
                  {r.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink">
                      <ShieldCheck size={17} className="mt-1 flex-shrink-0 text-brand-green-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                <ButtonLink to="/quote" variant="outlineNavy" className="mt-7">
                  Get Started <ArrowRight size={16} />
                </ButtonLink>
              </div>
              <div className={`relative ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                <div
                  className={`absolute inset-6 rounded-[36px] ${
                    i % 3 === 0 ? 'bg-navy' : i % 3 === 1 ? 'bg-brand-green-500' : 'bg-gold-400'
                  } opacity-[0.08]`}
                  aria-hidden
                />
                <img
                  src={r.image}
                  alt={r.alt}
                  loading="lazy"
                  className="relative aspect-[4/3] w-full rounded-[28px] object-cover shadow-lift"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison strip */}
      <section className="bg-mist py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[32px] shadow-lift md:grid-cols-2">
            <div className="bg-navy p-10 md:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">{s.whyus_comparison_typical_title || 'Typical Procurement'}</p>
              <ul className="mt-7 space-y-4 text-navy-100/75">
                {typicalBullets.map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-10 md:p-14">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-green-600">{s.whyus_comparison_gnab_title || 'The GNAB Way'}</p>
              <ul className="mt-7 space-y-4 text-ink">
                {gnabBullets.map((t) => (
                  <li key={t} className="flex items-start gap-3 font-medium">
                    <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-brand-green-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PremiumCTA
        eyebrow={s.whyus_cta_eyebrow || 'Why GNAB'}
        title={s.whyus_cta_title || 'Experience the GNAB Difference'}
            titleHighlight={s.whyus_cta_title_highlight}
            features={[s.whyus_cta_feature1, s.whyus_cta_feature2, s.whyus_cta_feature3]}
        subtitle={s.whyus_cta_subtitle || 'Join the organisations across Ghana already procuring smarter.'}
        primary={{ label: s.whyus_cta_primary_label || 'Request a Quote Today', to: '/quote' }}
        secondary={{ label: s.whyus_cta_secondary_label || 'Talk to Our Team', to: '/contact' }}
      />
    </div>
  )
}
