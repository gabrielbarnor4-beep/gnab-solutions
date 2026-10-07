import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Eye,
  Lightbulb,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import { COMPANY, IMAGES } from '@/lib/utils'
import { setPageMeta, useSiteImage, useSiteSettings } from '@/lib/siteData'
import {
  PageHero,
  PremiumCTA,
  Reveal,
  SectionHeading,
  staggerChild,
  staggerParent,
} from '@/components/ui'

const FALLBACK_VALUES = [
  { icon: ShieldCheck, title: 'Integrity', desc: 'We conduct business with uncompromising ethical standards.' },
  { icon: Users, title: 'Customer Focus', desc: 'Your success drives every decision we make.' },
  { icon: Award, title: 'Excellence', desc: 'We pursue excellence in every detail of every order.' },
  { icon: Lightbulb, title: 'Innovation', desc: 'We embrace smarter ways to simplify procurement.' },
]

const FALLBACK_PILLARS = [
  { value: '100+', label: 'Trusted Suppliers' },
  { value: '500+', label: 'Products Sourced' },
  { value: '24h', label: 'Quote Turnaround' },
  { value: '100%', label: 'Commitment' },
]

export default function AboutPage() {
  const s = useSiteSettings()
  const heroImg = useSiteImage('about_hero', IMAGES.about2)
  const warehouseImg = useSiteImage('about_warehouse', IMAGES.warehouse)
  useEffect(() => { setPageMeta('About Us | GNAB Business Solutions', COMPANY.description, heroImg) }, [heroImg])

  const pillars: { value: string; label: string }[] = (() => {
    try {
      const parsed = JSON.parse(s.about_pillars || '[]')
      if (Array.isArray(parsed) && parsed.length) return parsed
      return FALLBACK_PILLARS
    } catch { return FALLBACK_PILLARS }
  })()

  const values: { title: string; desc: string }[] = (() => {
    try {
      const parsed = JSON.parse(s.about_values_cards || '[]')
      if (Array.isArray(parsed) && parsed.length) return parsed
      return FALLBACK_VALUES.map(v => ({ title: v.title, desc: v.desc }))
    } catch { return FALLBACK_VALUES.map(v => ({ title: v.title, desc: v.desc })) }
  })()

  // Map icons for dynamic values fallback
  const iconForValue = (title: string) => {
    const map: Record<string, typeof ShieldCheck> = { Integrity: ShieldCheck, 'Customer Focus': Users, Excellence: Award, Innovation: Lightbulb }
    return map[title] ?? ShieldCheck
  }

  return (
    <div>
      <PageHero
        eyebrow="About Us"
        title={<>{(s.about_hero_title || 'The Partner Behind Seamless Procurement').replace(s.about_hero_title_highlight || 'Seamless Procurement', '').trim()} <span className="text-gradient-gold">{s.about_hero_title_highlight || 'Seamless Procurement'}</span></>}
        subtitle={s.about_hero_subtitle || COMPANY.description}
        image={heroImg}
      />

      {/* Story + Mission/Vision */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                align="left"
                eyebrow={s.about_story_eyebrow || "Our Story"}
                title={s.about_story_title || "Built on Trust, Driven by Results"}
              />
              <Reveal delay={0.1}>
                <p className="-mt-4 text-[17px] leading-relaxed text-ink-light">
                  {s.about_story_p1 || 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.'}
                </p>
                <p className="mt-5 text-[17px] leading-relaxed text-ink-light">
                  {s.about_story_p2 || 'We serve businesses, government institutions, NGOs, schools, hospitals, hotels and SMEs across Ghana with reliable, efficient and cost-effective procurement solutions.'}
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-7">
                  {pillars.map((p) => (
                    <li key={p.label} className="border-l-2 border-gold-400 pl-5">
                      <p className="font-display text-3xl font-extrabold text-navy">{p.value}</p>
                      <p className="mt-1 text-[13px] font-medium uppercase tracking-wide text-ink-light">{p.label}</p>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            {/* Mission & Vision cards */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-[28px] bg-navy p-9 shadow-lift md:p-11"
              >
                <div className="relative flex items-start gap-5">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gold-400/15 text-gold-400 ring-1 ring-gold-400/30">
                    <Target size={26} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">{s.about_mission_title || 'Our Mission'}</h3>
                    <p className="mt-3 text-[16px] leading-relaxed text-navy-100/80">{s.about_mission_desc || COMPANY.mission}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-[28px] bg-brand-green-500 p-9 shadow-lift md:p-11"
              >
                <div className="relative flex items-start gap-5">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25">
                    <Eye size={26} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">{s.about_vision_title || 'Our Vision'}</h3>
                    <p className="mt-3 text-[16px] leading-relaxed text-white/85">{s.about_vision_desc || COMPANY.vision}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden rounded-[28px] shadow-lift"
              >
                <img src={warehouseImg} alt="GNAB logistics operations" className="h-56 w-full object-cover" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="bg-mist py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={s.about_values_eyebrow || "What Guides Us"}
            title={s.about_values_title || "Our Core Values"}
            subtitle={s.about_values_subtitle || "Four principles that shape every partnership and every delivery."}
          />
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {values.map((v) => {
              const Icon = iconForValue(v.title)
              return (
                <motion.div key={v.title} variants={staggerChild}>
                  <div className="card-hover h-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-soft">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy">
                      <Icon size={28} strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-6 font-display text-lg font-bold text-navy">{v.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink-light">{v.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      <PremiumCTA
        eyebrow={s.about_cta_eyebrow || "Partner with us"}
        title={s.about_cta_title || "Partner With Us Today"}
            titleHighlight={s.about_cta_title_highlight}
            features={[s.about_cta_feature1, s.about_cta_feature2, s.about_cta_feature3]}
        subtitle={s.about_cta_subtitle || "Experience the GNAB difference in procurement and supply solutions."}
        primary={{ label: s.about_cta_primary_label || 'Get Started', to: '/quote' }}
        secondary={{ label: s.about_cta_secondary_label || 'Become a Supplier', to: '/supplier-registration' }}
      />
    </div>
  )
}
