import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Mail, Menu, Phone, X } from 'lucide-react'
import { NAV_LINKS, cn } from '@/lib/utils'
import { useSiteSettings } from '@/lib/siteData.tsx'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const s = useSiteSettings()
  const moreRef = useRef<HTMLDivElement>(null)

  // Scroll — rAF throttled, premium smooth
  useEffect(() => {
    let ticking = false
    const update = () => {
      setScrolled(window.scrollY > 16)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile on route change + reset scroll
  useEffect(() => {
    setOpen(false)
    setMoreOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  // Lock body scroll when mobile open + ESC + resize to desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setMoreOpen(false) }
    }
    const onResize = () => {
      if (window.innerWidth >= 1280) setOpen(false)
    }
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  // Close More dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const visibleCompact = NAV_LINKS.slice(0, 6)
  const overflowLinks = NAV_LINKS.slice(6)

  const showTopBar = (s.header_show_top_bar ?? 'true') !== 'false'
  const showPhone = (s.header_show_phone ?? 'true') !== 'false'
  const showEmail = (s.header_show_email ?? 'true') !== 'false'
  const showTagline = (s.header_show_tagline ?? 'true') !== 'false'
  const hasTopBarContent = showPhone || showEmail || showTagline

  return (
    <header className="sticky top-0 z-[1000] isolate">
      {/* Top utility bar — motion height, respects Admin → Settings → Header Top Bar toggle */}
      <AnimatePresence initial={false}>
        {showTopBar && hasTopBarContent && !scrolled && (
          <motion.div
            key="topbar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="hidden overflow-hidden bg-navy text-white/90 md:block"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2.5 text-[13px] lg:px-8">
              <div className="flex items-center gap-5 lg:gap-7">
                {showPhone && (
                  <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 transition-colors hover:text-gold-400 focus-visible:outline-none focus-visible:text-gold-400">
                    <Phone size={13} className="flex-shrink-0" /> <span className="whitespace-nowrap">{s.phone}</span>
                  </a>
                )}
                {showEmail && (
                  <a href={`mailto:${s.email}`} className="hidden items-center gap-2 transition-colors hover:text-gold-400 focus-visible:outline-none sm:inline-flex">
                    <Mail size={13} className="flex-shrink-0" /> <span className="whitespace-nowrap">{s.email}</span>
                  </a>
                )}
              </div>
              {showTagline && (
                <span className="hidden items-center gap-2 tracking-wide lg:flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
                  <span className="whitespace-nowrap">{s.tagline}</span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main nav — premium glass on scroll */}
      <div
        className={cn(
          'relative border-b transition-all duration-500 ease-out will-change-[backdrop-filter,background-color,box-shadow]',
          scrolled
            ? 'glass border-white/40 shadow-[0_8px_30px_rgba(11,46,89,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] supports-[backdrop-filter]:bg-white/70'
            : 'border-transparent bg-white shadow-none'
        )}
      >
        {/* Gold hairline — premium accent when scrolled */}
        <span
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent transition-opacity duration-500',
            scrolled ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden
        />

        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className={cn('grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 transition-[height] duration-500 ease-out', scrolled ? 'h-[64px]' : 'h-[76px] sm:h-[80px]')}>
            {/* Logo — premium hover lift */}
            <Link to="/" className="group flex flex-shrink-0 items-center gap-2 sm:gap-3 min-w-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/50 rounded-xl justify-self-start" aria-label={`${s.company_name} home`}>
              <span className="relative flex-shrink-0">
                <img
                  src={s.logo_url}
                  alt={s.company_name}
                  width={48}
                  height={48}
                  decoding="async"
                  className={cn('w-auto object-contain transition-all duration-500 ease-out will-change-[height] group-hover:scale-[1.02]', scrolled ? 'h-9' : 'h-10 sm:h-12')}
                />
                <span className="pointer-events-none absolute -inset-2 rounded-2xl bg-gold-400/0 transition-colors group-hover:bg-gold-400/5" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col leading-[0.95] sm:leading-tight">
                <span className="truncate font-display text-[14px] font-bold tracking-tight text-navy sm:text-[15px] xl:text-[16px]">
                  GNAB <span className="font-semibold text-brand-green-500">Business Solutions</span>
                </span>
                <span className="flex w-full justify-between text-[7px] font-medium uppercase tracking-[0.14em] text-gold-600 sm:text-[7.5px] xl:text-[8px] leading-none" aria-hidden>
                  <span>One</span><span>Partner.</span><span>Endless</span><span>Solutions.</span>
                </span>
              </span>
            </Link>

            {/* Desktop — full (≥1280px): all 10 links centered */}
            <nav aria-label="Primary" className="hidden min-w-0 w-full items-center justify-center gap-1 px-1 xl:flex justify-self-center overflow-visible">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.path} to={link.path} end={link.path === '/'}>
                  {({ isActive }) => (
                    <span
                      className={cn(
                        'relative inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-2 text-[12.5px] font-medium transition-colors duration-200 xl:px-3 xl:text-[13px] focus-visible:outline-none',
                        isActive ? 'text-navy' : 'text-ink-light hover:text-navy'
                      )}
                    >
                      {link.name}
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 -z-10 rounded-full bg-navy-50 ring-1 ring-navy-100/50"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      {/* subtle underline on hover */}
                      <span className="pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-gold-400/60 transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Compact (1024→1279px): 6 links + premium More dropdown */}
            <nav aria-label="Primary compact" className="hidden min-w-0 w-full items-center justify-center gap-1 px-1 lg:flex xl:hidden justify-self-center overflow-visible">
              {visibleCompact.map((link) => (
                <NavLink key={link.path} to={link.path} end={link.path === '/'}>
                  {({ isActive }) => (
                    <span className={cn('whitespace-nowrap rounded-full px-2 py-2 text-[12px] font-medium', isActive ? 'bg-navy-50 text-navy ring-1 ring-navy-100/50' : 'text-ink-light hover:text-navy hover:bg-mist')}>
                      {link.name}
                    </span>
                  )}
                </NavLink>
              ))}
              <div ref={moreRef} className="relative ml-1">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  className={cn('inline-flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/50', moreOpen ? 'bg-navy text-white' : 'bg-mist text-ink-light hover:text-navy hover:bg-navy-50')}
                >
                  More <ChevronDown size={14} className={cn('transition-transform duration-300', moreOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-1/2 top-[calc(100%+12px)] z-50 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-lift"
                      role="menu"
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" aria-hidden />
                      {overflowLinks.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={() => setMoreOpen(false)}
                          className={({ isActive }) => cn('flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-navy text-white' : 'text-ink hover:bg-mist hover:text-navy')}
                          role="menuitem"
                        >
                          {link.name}
                        </NavLink>
                      ))}
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <Link to="/quote" onClick={() => setMoreOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-brand-green-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600">
                          Request a Quote <ArrowRight size={14} />
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* CTA + hamburger — always flex-shrink-0, never covered */}
            <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3 justify-self-end">
              <Link
                to="/quote"
                className="btn-shine group hidden flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-green-500 px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-lg shadow-green-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-green-600 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/50 sm:px-5 sm:text-[13px] lg:inline-flex"
              >
                <span className="relative">Request a Quote</span>
                <ArrowRight size={14} className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={() => setOpen(!open)}
                aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={open}
                aria-controls="mobile-nav"
                className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-transparent bg-mist text-navy transition-all hover:border-gray-200 hover:bg-white hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/50 xl:hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {open ? (
                    <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X size={20} />
                    </motion.span>
                  ) : (
                    <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile — premium overlay + spring sheet */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 top-[64px] z-40 bg-navy/20 backdrop-blur-sm xl:hidden"
                aria-hidden
                onClick={() => setOpen(false)}
              />
              <motion.nav
                id="mobile-nav"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-50 overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl xl:hidden supports-[backdrop-filter]:bg-white/85"
                aria-label="Mobile"
              >
                <motion.div
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } } }}
                  className="space-y-1 px-4 py-6 sm:px-6"
                >
                  {NAV_LINKS.map((link) => (
                    <motion.div key={link.path} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } } }}>
                      <NavLink
                        to={link.path}
                        end={link.path === '/'}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-medium transition-all',
                            isActive ? 'bg-navy text-white shadow-md' : 'bg-mist/60 text-ink hover:bg-navy-50 hover:text-navy'
                          )
                        }
                      >
                        {link.name}
                      </NavLink>
                    </motion.div>
                  ))}
                  <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="pt-3">
                    <Link
                      to="/quote"
                      className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green-500 px-4 py-4 text-[15px] font-semibold text-white shadow-lg shadow-green-900/20"
                    >
                      Request a Quote <ArrowRight size={18} />
                    </Link>
                    <p className="mt-3 text-center text-xs text-ink-light">Mon–Fri 8am–5pm GMT · Replies in hours</p>
                  </motion.div>
                </motion.div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
