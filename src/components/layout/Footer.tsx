import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Download, Info, Link as LinkIcon, Lock, Mail, MapPin, ArrowUpRight, MessageCircle, Phone } from 'lucide-react'
import { COMPANY } from '@/lib/utils'
import { FooterHeading } from '@/components/ui'
import {
  fetchActiveCompanyProfile,
  fetchFooterServices,
  parseFooterContactItems,
  parseFooterQuickLinks,
  useSiteSettings,
  type FooterContactItem,
  type PublicService,
} from '@/lib/siteData.tsx'

const FALLBACK_SERVICE_LINKS = [
  { name: 'Office Stationery & Consumables', slug: 'office-stationery' },
  { name: 'IT Equipment & Accessories', slug: 'it-equipment' },
  { name: 'Cleaning & Janitorial Supplies', slug: 'cleaning-janitorial' },
  { name: 'PPE & Safety', slug: 'ppe-safety' },
  { name: 'Office Furniture', slug: 'office-furniture' },
  { name: 'Printing & Branding', slug: 'printing-branding' },
  { name: 'Electrical Materials', slug: 'electrical-materials' },
  { name: 'Automobile Services & Spares', slug: 'automobile-services' },
  { name: 'IT Solutions & Digital Services', slug: 'it-solutions-digital-services' },
  { name: 'Custom Procurement & Sourcing', slug: 'custom-sourcing' },
]

function contactHref(item: FooterContactItem): string | null {
  const v = item.value.trim()
  if (!v) return null
  if (item.kind === 'email') return `mailto:${v}`
  if (item.kind === 'phone') return `tel:${v.replace(/\s/g, '')}`
  if (item.kind === 'whatsapp') return v.startsWith('http') ? v : `https://wa.me/${v.replace(/[^0-9]/g, '')}`
  if (item.kind === 'link') return v
  return null
}

function ContactIcon({ kind }: { kind: FooterContactItem['kind'] }) {
  const cls = 'mt-0.5 flex-shrink-0 text-gold-400'
  if (kind === 'email') return <Mail size={16} className={cls} />
  if (kind === 'phone') return <Phone size={16} className={cls} />
  if (kind === 'whatsapp') return <MessageCircle size={16} className={cls} />
  if (kind === 'address') return <MapPin size={16} className={cls} />
  if (kind === 'hours') return <Clock size={16} className={cls} />
  if (kind === 'link') return <LinkIcon size={16} className={cls} />
  return <Info size={16} className={cls} />
}

export default function Footer() {
  const year = new Date().getFullYear()
  const s = useSiteSettings()
  const [profileMsg, setProfileMsg] = useState('')
  const [footerServices, setFooterServices] = useState<PublicService[] | null>(null)

  useEffect(() => {
    void fetchFooterServices(20).then((rows) => {
      if (rows.length > 0) setFooterServices(rows)
      else setFooterServices(null)
    })
  }, [])

  const serviceLinks = footerServices
    ? footerServices.map((sv) => ({
        name: (sv.footer_label?.trim() || sv.name),
        slug: sv.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        path: sv.footer_path?.trim() || undefined,
      }))
    : FALLBACK_SERVICE_LINKS.map((s) => ({ ...s, path: undefined as string | undefined }))

  const showBrand = (s.footer_show_brand ?? 'true') !== 'false'
  const showQuick = (s.footer_show_quick_links ?? 'true') !== 'false'
  const showServices = (s.footer_show_services ?? 'true') !== 'false'
  const showContact = (s.footer_show_contact ?? 'true') !== 'false'
  const showSocials = (s.footer_show_socials ?? 'true') !== 'false'
  const showBottom = (s.footer_show_bottom ?? 'true') !== 'false'
  // Supports legacy string[] + new object[] with per-item visible toggles.
  const quickLinks = parseFooterQuickLinks(s.footer_quick_links).filter((l) => l.visible !== false)

  // Contact column: admin-managed items win; otherwise legacy email/phone/address settings.
  const storedContacts = parseFooterContactItems((s as unknown as { footer_contact_items?: string }).footer_contact_items).filter((c) => c.visible !== false && c.value.trim())
  const legacyContacts: FooterContactItem[] = [
    ...(s.email?.trim() ? [{ id: 'email', kind: 'email' as const, label: 'Email', value: s.email.trim(), visible: true }] : []),
    ...(s.phone?.trim() ? [{ id: 'phone', kind: 'phone' as const, label: 'Phone', value: s.phone.trim(), visible: true }] : []),
    ...(s.address?.trim() ? [{ id: 'address', kind: 'address' as const, label: 'Address', value: s.address.trim(), visible: true }] : []),
  ]
  // If admin has saved explicit items (even hidden ones), respect them; else legacy fallback.
  const rawStored = parseFooterContactItems((s as unknown as { footer_contact_items?: string }).footer_contact_items)
  const contactItems = rawStored.length > 0 ? storedContacts : legacyContacts

  const downloadProfile = async () => {
    setProfileMsg('')
    const doc = await fetchActiveCompanyProfile()
    if (!doc) {
      setProfileMsg(
        'Company Profile is currently being updated. Please check back shortly or contact GNAB Business Solutions for more information.'
      )
      setTimeout(() => setProfileMsg(''), 8000)
      return
    }
    window.open(doc.url, '_blank', 'noopener,noreferrer')
  }

  const socials = [
    { name: 'LinkedIn', href: s.social_linkedin },
    { name: 'Facebook', href: s.social_facebook },
    { name: 'X', href: s.social_twitter },
    { name: 'Instagram', href: s.social_instagram },
  ].filter((x) => x.href)

  return (
    <footer className="relative overflow-hidden bg-navy-800 text-white">
      {/* subtle pattern */}
      <div
        className="absolute -top-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #D4AF37, transparent)' }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
          {/* Brand */}
          {showBrand && (
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="rounded-2xl bg-white p-2.5 shadow-lg">
                  <img src={s.logo_url} alt={s.company_name} className="h-10 w-auto" />
                </span>
              </Link>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-navy-100/75">{s.company_description}</p>
              <p className="mt-5 inline-flex rounded-full border border-gold-400/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                {s.tagline}
              </p>

              <button
                onClick={downloadProfile}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 font-display text-sm font-bold text-navy shadow-lg shadow-gold-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-300"
              >
                <Download size={16} /> Download Company Profile
              </button>
              {profileMsg && (
                <p role="status" className="mt-3 max-w-sm rounded-xl bg-white/10 px-4 py-3 text-sm leading-relaxed text-navy-100/85 ring-1 ring-white/15">
                  {profileMsg}
                </p>
              )}
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-navy-100/55">{s.footer_text}</p>
            </div>
          )}

          {/* Quick links */}
          {showQuick && (
            <nav aria-label="Footer">
              <FooterHeading title={s.footer_quick_links_title || 'Quick Links'} style={s.footer_heading_style || 'gold-bar'} />
              <ul className="space-y-3">
                {quickLinks.map((l) => (
                  <li key={l.path}>
                    <Link to={l.path} className="group inline-flex items-center gap-1.5 text-[15px] text-navy-100/70 transition-colors hover:text-gold-400">
                      <ArrowUpRight size={13} className="opacity-0 transition-all duration-200 group-hover:opacity-100" />
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Services */}
          {showServices && (
            <div>
              <FooterHeading title={s.footer_services_title || 'Services'} style={s.footer_heading_style || 'gold-bar'} />
              <ul className="space-y-3">
                {serviceLinks.map((sv) => (
                  <li key={sv.slug}>
                    <Link to={(sv as unknown as { path?: string }).path || `/services?highlight=${sv.slug}`} className="text-[15px] text-navy-100/70 transition-colors hover:text-gold-400">
                      {sv.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {showContact && (
            <div>
              <FooterHeading title={s.footer_contact_title || 'Contact'} style={s.footer_heading_style || 'gold-bar'} />
              <ul className="space-y-4 text-[15px]">
                {contactItems.map((c) => {
                  const href = contactHref(c)
                  const body = (
                    <>
                      <ContactIcon kind={c.kind} />
                      <span className="break-words">{c.value}</span>
                    </>
                  )
                  return (
                    <li key={c.id}>
                      {href ? (
                        <a href={href} target={c.kind === 'link' || c.kind === 'whatsapp' ? '_blank' : undefined} rel={c.kind === 'link' || c.kind === 'whatsapp' ? 'noopener noreferrer' : undefined} className="flex items-start gap-3 text-navy-100/70 transition-colors hover:text-gold-400">
                          {body}
                        </a>
                      ) : (
                        <span className="flex items-start gap-3 text-navy-100/70">{body}</span>
                      )}
                    </li>
                  )
                })}
              </ul>

              {showSocials && socials.length > 0 && (
                <div className="mt-7 flex gap-2.5">
                  {socials.map((x) => (
                    <a
                      key={x.name}
                      href={x.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${COMPANY.name} on ${x.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[11px] font-bold text-navy-100/80 transition-all duration-200 hover:border-gold-400 hover:bg-gold-400 hover:text-navy"
                    >
                      {x.name === 'LinkedIn' ? 'in' : x.name === 'Facebook' ? 'f' : x.name === 'X' ? 'X' : 'ig'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {showBottom && (
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="flex items-center gap-3 text-sm text-navy-100/60">
              <span>&copy; {year} {s.company_name}. All rights reserved.</span>
              <Link to="/admin/login" aria-label="Administrator sign-in" className="text-navy-100/30 transition-colors hover:text-gold-400">
                <Lock size={12} />
              </Link>
            </p>
            <div className="flex items-center gap-8 text-sm text-navy-100/60">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="transition-colors hover:text-gold-400">
                Back to top &uarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </footer>
  )
}
