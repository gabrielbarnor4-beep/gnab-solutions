import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion'
import { cloneElement, isValidElement, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { cn, imgSrcSet } from '@/lib/utils'
import { ctaThemeClass, splitHighlight, titleSizeClass, type CtaTheme, type EyebrowStyle, type HeroAlign, type TitleSize } from '@/lib/design'
import { useSiteSettings } from '@/lib/siteData'

/* ---------- Scroll reveal wrapper ---------- */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduce = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      animate={inView && !reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
}

/* ---------- Section heading ---------- */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  dark = false,
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: string
  align?: 'left' | 'center'
  dark?: boolean
}) {
  return (
    <Reveal className={cn('mb-14', align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left max-w-2xl')}>
      <p
        className={cn(
          'inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.18em] mb-4',
          dark ? 'text-gold-400' : 'text-gold-600'
        )}
      >
        <span className="h-px w-8 bg-current opacity-60" />
        {eyebrow}
        <span className="h-px w-8 bg-current opacity-60" />
      </p>
      <h2
        className={cn(
          'text-3xl md:text-[42px] md:leading-[1.15] font-bold',
          dark ? 'text-white' : 'text-navy'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-5 text-base md:text-lg leading-relaxed', dark ? 'text-navy-100/80' : 'text-ink-light')}>
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}

/* ---------- Buttons ---------- */
const btnBase =
  'group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/50 disabled:opacity-60 disabled:pointer-events-none'

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  size = 'md',
  className,
}: {
  to: string
  children: ReactNode
  variant?: 'primary' | 'outlineLight' | 'outlineNavy' | 'gold'
  size?: 'md' | 'lg'
  className?: string
}) {
  const variants = {
    primary:
      'bg-brand-green-500 text-white hover:bg-brand-green-600 shadow-lg shadow-green-900/20 hover:shadow-xl hover:-translate-y-0.5',
    gold: 'bg-gold-400 text-navy hover:bg-gold-500 shadow-lg shadow-gold-500/30 hover:-translate-y-0.5',
    outlineLight:
      'border-2 border-white/70 text-white hover:bg-white hover:text-navy backdrop-blur-sm',
    outlineNavy: 'border-2 border-navy text-navy hover:bg-navy hover:text-white',
  }
  const sizes = {
    md: 'px-7 py-3 text-sm',
    lg: 'px-9 py-4 text-base',
  }
  return (
    <Link to={to} className={cn(btnBase, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  )
}

export function Button({
  children,
  type = 'submit',
  loading = false,
  className,
}: {
  children: ReactNode
  type?: 'submit' | 'button'
  loading?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      disabled={loading}
      className={cn(
        btnBase,
        'w-full bg-brand-green-500 text-white hover:bg-brand-green-600 shadow-lg shadow-green-900/20 py-4 text-base',
        className
      )}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Sending...
        </>
      ) : (
        children
      )}
    </button>
  )
}

/* ---------- Form fields ---------- */
export const inputClass =
  'w-full rounded-xl border border-gray-200 bg-mist/60 px-4 py-3.5 text-[15px] text-ink placeholder-gray-400 outline-none transition-all duration-200 focus:border-navy-400 focus:bg-white focus:ring-4 focus:ring-navy-100'

export function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  const baseId = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  let labelFor = baseId
  let childWithId: ReactNode = children
  if (isValidElement(children)) {
    const el = children as React.ReactElement<{ id?: string; name?: string }>
    const derivedId = (el.props as any).id || ((el.props as any).name ? `field-${String((el.props as any).name).replace(/[^a-z0-9]+/g, '-')}` : baseId)
    labelFor = derivedId
    if (!(el.props as any).id) {
      childWithId = cloneElement(el as React.ReactElement<any>, { id: derivedId } as any)
    }
  }
  return (
    <div>
      <label htmlFor={labelFor} className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-ink-light">
        {label} {required && <span className="text-brand-green-500">*</span>}
      </label>
      {childWithId}
    </div>
  )
}

/* ---------- Shared eyebrow — pill / minimal / tag (admin-driven) ---------- */
export function Eyebrow({ text, style = 'pill' }: { text: string; style?: string }) {
  if (style === 'minimal') {
    return (
      <p className="mx-auto mb-8 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
        <span className="h-px w-10 bg-gold-400/60" aria-hidden />
        {text}
        <span className="h-px w-10 bg-gold-400/60" aria-hidden />
      </p>
    )
  }
  if (style === 'tag') {
    return (
      <p className="mx-auto mb-8 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400 text-navy" aria-hidden>
          <Clock size={14} />
        </span>
        {text}
      </p>
    )
  }
  return (
    <p className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-400">
      {text}
    </p>
  )
}

/* ---------- Page hero (inner pages) — premium, matches CTA card ---------- */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  eyebrowStyle,
  align,
  titleSize,
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: string
  image?: string
  eyebrowStyle?: EyebrowStyle
  align?: HeroAlign
  titleSize?: TitleSize
}) {
  const allSettings = useSiteSettings() as unknown as { page_hero_eyebrow_style?: string; page_hero_align?: string; page_hero_title_size?: string }
  const style = (eyebrowStyle ?? allSettings.page_hero_eyebrow_style ?? 'pill') as EyebrowStyle
  const al = (align ?? allSettings.page_hero_align ?? 'center') as HeroAlign
  const size = (titleSize ?? allSettings.page_hero_title_size ?? 'standard') as TitleSize
  const centered = al !== 'left'
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-800 to-navy-900">
      {image && <img src={image} srcSet={imgSrcSet(image)} sizes="100vw" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.07]" aria-hidden loading="lazy" decoding="async" />}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand-green-500/10 blur-3xl" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" aria-hidden />
      {/* subtle gold border like CTA outer p-[1.5px] */}
      <div className="pointer-events-none absolute inset-0 rounded-none ring-1 ring-white/5" aria-hidden />
      <div className={cn('relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8', centered ? 'text-center' : 'text-left')}>
        {eyebrow && (
          style === 'pill' ? (
            <p className={cn('mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-400 backdrop-blur-sm', !centered && 'mx-0')} style={centered ? undefined : { marginLeft: 0 }}>
              {eyebrow}
            </p>
          ) : style === 'minimal' ? (
            <p className={cn('mb-6 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-gold-400', centered && 'mx-auto')}>
              {!centered && <span className="h-px w-10 bg-gold-400/60" aria-hidden />}
              {centered && <span className="h-px w-10 bg-gold-400/60" aria-hidden />}
              {eyebrow}
              <span className="h-px w-10 bg-gold-400/60" aria-hidden />
            </p>
          ) : (
            <p className={cn('mb-6 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-white', centered && 'mx-auto')}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold-400 text-navy" aria-hidden>
                <Clock size={14} />
              </span>
              {eyebrow}
            </p>
          )
        )}
        <h1 className={cn(titleSizeClass(size, 'cta'), centered ? 'mx-auto text-center' : 'mx-0 max-w-3xl text-left')}>{title}</h1>
        {subtitle && <p className={cn('mt-6 max-w-2xl text-lg leading-relaxed text-navy-100/80', centered && 'mx-auto')}>{subtitle}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
    </section>
  )
}

/* ---------- Premium CTA — Home "Ready to Simplify Your Procurement?" design, admin-driven ---------- */
export function PremiumCTA({
  eyebrow = "Let's talk",
  title,
  titleHighlight,
  subtitle,
  primary,
  secondary,
  bgImage,
  eyebrowStyle,
  align,
  titleSize,
  theme,
  features,
}: {
  eyebrow?: string
  title: ReactNode
  titleHighlight?: string
  subtitle?: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
  bgImage?: string
  eyebrowStyle?: EyebrowStyle
  align?: HeroAlign
  titleSize?: TitleSize
  theme?: CtaTheme
  features?: string[]
}) {
  const allSettings = useSiteSettings() as unknown as { cta_eyebrow_style?: string; cta_align?: string; cta_title_size?: string; cta_theme?: string }
  const style = (eyebrowStyle ?? allSettings.cta_eyebrow_style ?? 'pill') as EyebrowStyle
  const al = (align ?? allSettings.cta_align ?? 'center') as HeroAlign
  const size = (titleSize ?? allSettings.cta_title_size ?? 'standard') as TitleSize
  const th = (theme ?? allSettings.cta_theme ?? 'navy-gold') as CtaTheme
  const t = ctaThemeClass(th)
  const centered = al !== 'left'
  const heading: ReactNode =
    typeof title === 'string' && (titleHighlight ?? '') !== ''
      ? (() => {
          const { prefix, gold } = splitHighlight(title, titleHighlight ?? '')
          return (
            <>
              {prefix} {gold ? <span className="text-gradient-gold">{gold}</span> : null}
            </>
          )
        })()
      : title
  return (
    <section className="bg-mist py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className={cn('relative overflow-hidden rounded-[32px] p-[1.5px] shadow-lift', t.outer)}>
            <div className={cn('relative overflow-hidden rounded-[30px]', t.inner)}>
              {bgImage && <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.07]" aria-hidden />}
              <div className={cn('absolute -right-32 -top-32 h-96 w-96 rounded-full blur-3xl', t.orbA)} aria-hidden />
              <div className={cn('absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl', t.orbB)} aria-hidden />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" aria-hidden />
              <div className={cn('relative p-10 md:p-14', centered ? 'text-center' : 'text-left')}>
                <span className={cn('mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400 text-navy shadow-lg shadow-gold-500/25', centered && 'mx-auto')}>
                  <Clock size={28} />
                </span>
                <Eyebrow text={eyebrow} style={style} />
                <h2 className={cn(titleSizeClass(size, 'cta'), centered ? 'text-center' : 'mx-0 text-left')}>{heading}</h2>
                {subtitle && <p className={cn('mt-6 max-w-2xl text-lg leading-relaxed text-navy-100/80', centered && 'mx-auto')}>{subtitle}</p>}
                <div className={cn('mt-10 flex flex-col gap-4 sm:flex-row', centered ? 'items-center justify-center' : 'items-start justify-start')}>
                  <ButtonLink to={primary.to} variant="gold" size="lg">
                    {primary.label}
                  </ButtonLink>
                  {secondary && (
                    <ButtonLink to={secondary.to} variant="outlineLight" size="lg">
                      {secondary.label}
                    </ButtonLink>
                  )}
                </div>
                <div className={cn('mt-12 flex max-w-xl flex-wrap gap-6 border-t border-white/10 pt-8 text-sm', centered ? 'mx-auto items-center justify-center' : 'items-center justify-start')}>
                  <span className="inline-flex items-center gap-2 font-medium text-white/90">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> {features?.[0] || '24h response'}
                  </span>
                  <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
                  <span className="font-medium text-navy-100/70">{features?.[1] || '100% commitment'}</span>
                  <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
                  <span className="font-medium text-navy-100/70">{features?.[2] || 'No obligation until you approve'}</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- Footer column heading — classic / gold-bar / gold-highlight ---------- */
export function FooterHeading({ title, style = 'classic' }: { title: string; style?: string }) {
  const words = title.trim().split(/\s+/)
  if (style === 'gold-highlight' && words.length > 1) {
    const last = words[words.length - 1]!
    const rest = words.slice(0, -1).join(' ')
    return (
      <h3 className="mb-6 font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
        {rest} <span className="text-gradient-gold">{last}</span>
        <span className="mt-3 block h-0.5 w-10 bg-gradient-to-r from-gold-400 to-transparent" aria-hidden />
      </h3>
    )
  }
  if (style === 'gold-bar') {
    return (
      <h3 className="mb-6 font-display text-sm font-bold uppercase tracking-[0.18em] text-white">
        {title}
        <span className="mt-3 block h-0.5 w-10 bg-gradient-to-r from-gold-400 to-transparent" aria-hidden />
      </h3>
    )
  }
  return (
    <h3 className="mb-6 font-display text-sm font-bold uppercase tracking-[0.18em] text-white">{title}</h3>
  )
}
