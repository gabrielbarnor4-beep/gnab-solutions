import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, getPublicUrl } from '@/lib/supabase'
import { CATALOGUE } from '@/lib/catalogue'
import { COMPANY, CONTACT } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Settings — DB values layered over safe defaults                     */
/* ------------------------------------------------------------------ */

export interface SiteSettings {
  company_name: string
  tagline: string
  company_description: string
  email: string
  phone: string
  whatsapp: string
  address: string
  logo_url: string
  social_linkedin: string
  social_facebook: string
  social_twitter: string
  social_instagram: string
  seo_title: string
  seo_description: string
  footer_text: string
  favicon_url: string
  og_image_url: string
  // Deprecated: global Google embed retired — the contact map is Leaflet-OpenStreetMap
  // driven solely by Admin → Locations. Keys stay so old DB rows merge harmlessly.
  google_maps_embed_url: string
  google_maps_url: string
  hours_weekday: string
  hours_saturday: string
  hours_sunday: string
  header_show_top_bar: string
  header_show_phone: string
  header_show_email: string
  header_show_tagline: string
  footer_show_brand: string
  footer_show_quick_links: string
  footer_quick_links: string
  footer_show_services: string
  footer_show_contact: string
  footer_show_socials: string
  footer_show_bottom: string
  // Other pages — editable via Admin → Pages (mirrored)
  about_hero_title: string
  about_hero_subtitle: string
  about_story_eyebrow: string
  about_story_title: string
  about_story_p1: string
  about_story_p2: string
  about_pillars: string
  about_mission_title: string
  about_mission_desc: string
  about_vision_title: string
  about_vision_desc: string
  about_values_eyebrow: string
  about_values_title: string
  about_values_subtitle: string
  about_values_cards: string
  about_cta_eyebrow: string
  about_cta_title: string
  about_cta_subtitle: string
  about_cta_primary_label: string
  about_cta_secondary_label: string
  services_hero_title: string
  services_hero_subtitle: string
  services_section_eyebrow: string
  services_section_title: string
  services_section_subtitle: string
  industries_hero_title: string
  industries_hero_subtitle: string
  products_hero_title: string
  products_hero_subtitle: string
  products_search_placeholder: string
  products_empty_title: string
  products_empty_desc: string
  process_hero_title: string
  process_hero_subtitle: string
  process_guarantee: string
  whyus_hero_title: string
  whyus_hero_subtitle: string
  whyus_comparison_typical_title: string
  whyus_comparison_typical_bullets: string
  whyus_comparison_gnab_title: string
  whyus_comparison_gnab_bullets: string
  contact_hero_title: string
  contact_hero_subtitle: string
  contact_get_in_touch_title: string
  contact_get_in_touch_desc: string
  contact_form_title: string
  contact_form_subtitle: string
  contact_form_success_title: string
  contact_form_success_desc: string
  quote_hero_title: string
  quote_hero_subtitle: string
  quote_how_it_works_title: string
  quote_form_title: string
  supplier_hero_title: string
  supplier_hero_subtitle: string
  supplier_intro_desc: string
  testimonials_hero_title: string
  testimonials_hero_subtitle: string
  testimonials_share_title: string
  blog_hero_title: string
  blog_hero_subtitle: string
  // Hero highlights — for gold gradient like Home COT heading (3xl/5xl extrabold)
  about_hero_title_highlight: string
  services_hero_title_highlight: string
  industries_hero_title_highlight: string
  products_hero_title_highlight: string
  process_hero_title_highlight: string
  whyus_hero_title_highlight: string
  contact_hero_title_highlight: string
  quote_hero_title_highlight: string
  supplier_hero_title_highlight: string
  testimonials_hero_title_highlight: string
  blog_hero_title_highlight: string
  // COT per other pages — same premium design as Home COT (gold p-[1.5px] navy)
  services_cta_eyebrow: string
  services_cta_title: string
  services_cta_subtitle: string
  services_cta_primary_label: string
  services_cta_secondary_label: string
  industries_cta_eyebrow: string
  industries_cta_title: string
  industries_cta_subtitle: string
  industries_cta_primary_label: string
  industries_cta_secondary_label: string
  products_cta_eyebrow: string
  products_cta_title: string
  products_cta_subtitle: string
  products_cta_primary_label: string
  products_cta_secondary_label: string
  process_cta_eyebrow: string
  process_cta_title: string
  process_cta_subtitle: string
  process_cta_primary_label: string
  process_cta_secondary_label: string
  whyus_cta_eyebrow: string
  whyus_cta_title: string
  whyus_cta_subtitle: string
  whyus_cta_primary_label: string
  whyus_cta_secondary_label: string
  // COT title highlights — gold gradient tail like Home "Your Procurement?" (empty = plain title)
  about_cta_title_highlight: string
  services_cta_title_highlight: string
  industries_cta_title_highlight: string
  products_cta_title_highlight: string
  process_cta_title_highlight: string
  whyus_cta_title_highlight: string
  // CTA feature strips — per page, like Home home_cta.feature1-3 (030)
  about_cta_feature1: string
  about_cta_feature2: string
  about_cta_feature3: string
  services_cta_feature1: string
  services_cta_feature2: string
  services_cta_feature3: string
  industries_cta_feature1: string
  industries_cta_feature2: string
  industries_cta_feature3: string
  products_cta_feature1: string
  products_cta_feature2: string
  products_cta_feature3: string
  process_cta_feature1: string
  process_cta_feature2: string
  process_cta_feature3: string
  whyus_cta_feature1: string
  whyus_cta_feature2: string
  whyus_cta_feature3: string
  // Heading design system — premium options, admin-driven (029)
  home_hero_eyebrow_style: string
  home_hero_title_size: string
  home_hero_align: string
  page_hero_eyebrow_style: string
  page_hero_align: string
  page_hero_title_size: string
  cta_eyebrow_style: string
  cta_align: string
  cta_title_size: string
  cta_theme: string
  // Footer column headings — text + style (classic / gold-bar / gold-highlight)
  footer_quick_links_title: string
  footer_services_title: string
  footer_contact_title: string
  footer_heading_style: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  company_name: COMPANY.name,
  tagline: COMPANY.tagline,
  company_description: COMPANY.description,
  email: CONTACT.email,
  phone: CONTACT.phone,
  whatsapp: CONTACT.whatsapp,
  address: CONTACT.address,
  logo_url: CONTACT.logo, // your real GNAB logo — admin can replace via Settings → Branding → Company Logo (media/branding), mirrored live everywhere
  social_linkedin: '',
  social_facebook: '',
  social_twitter: '',
  social_instagram: '',
  seo_title: 'GNAB Business Solutions | One Partner. Endless Solutions.',
  seo_description: COMPANY.description,
  footer_text: 'Simplifying procurement for organisations across Ghana and Beyond.',
  favicon_url: CONTACT.logo, // same real logo by default — admin can set a distinct square favicon via Settings → Branding → Favicon
  og_image_url: CONTACT.logo, // same real logo by default — admin can set a 1200×630 OG image via Settings → Branding → OG Image
  google_maps_embed_url: '',
  google_maps_url: '',
  hours_weekday: '8:00 – 17:00',
  hours_saturday: 'Closed',
  hours_sunday: 'Closed',
  header_show_top_bar: 'true',
  header_show_phone: 'true',
  header_show_email: 'true',
  header_show_tagline: 'true',
  footer_show_brand: 'true',
  footer_show_quick_links: 'true',
  footer_quick_links: JSON.stringify(["/","/about","/services","/industries","/products","/process","/why-us","/blog","/supplier-registration"]),
  footer_show_services: 'true',
  footer_show_contact: 'true',
  footer_show_socials: 'true',
  footer_show_bottom: 'true',
  about_hero_title: 'The Partner Behind Seamless Procurement',
  about_hero_subtitle: COMPANY.description,
  about_story_eyebrow: 'Our Story',
  about_story_title: 'Built on Trust, Driven by Results',
  about_story_p1: 'GNAB Business Solutions is a trusted procurement and supply partner providing organizations with a single point of contact for sourcing, purchasing and delivering quality products across multiple industries.',
  about_story_p2: 'We serve businesses, government institutions, NGOs, schools, hospitals, hotels and SMEs across Ghana with reliable, efficient and cost-effective procurement solutions.',
  about_pillars: JSON.stringify([{value: "100+", label: "Trusted Suppliers"}, {value: "500+", label: "Products Sourced"}, {value: "24h", label: "Quote Turnaround"}, {value: "100%", label: "Commitment"}]),
  about_mission_title: 'Our Mission',
  about_mission_desc: COMPANY.mission,
  about_vision_title: 'Our Vision',
  about_vision_desc: COMPANY.vision,
  about_values_eyebrow: 'What Guides Us',
  about_values_title: 'Our Core Values',
  about_values_subtitle: 'Four principles that shape every partnership and every delivery.',
  about_values_cards: JSON.stringify([{title:"Integrity",desc:"We conduct business with uncompromising ethical standards."},{title:"Customer Focus",desc:"Your success drives every decision we make."},{title:"Excellence",desc:"We pursue excellence in every detail of every order."},{title:"Innovation",desc:"We embrace smarter ways to simplify procurement."}]),
  about_cta_eyebrow: 'Partner with us',
  about_cta_title: 'Partner With Us Today',
  about_cta_subtitle: 'Experience the GNAB difference in procurement and supply solutions.',
  about_cta_primary_label: 'Get Started',
  about_cta_secondary_label: 'Become a Supplier',
  services_hero_title: 'Procurement Solutions for Every Need',
  services_hero_subtitle: 'From everyday office essentials to fully custom sourcing — one partner, endless solutions.',
  services_section_eyebrow: 'What We Offer',
  services_section_title: 'Explore Our Service Catalogues',
  services_section_subtitle: 'Click any service to browse its full product catalogue.',
  industries_hero_title: 'Trusted Across Every Sector',
  industries_hero_subtitle: 'From government ministries to growing startups — we understand the unique procurement needs of each industry.',
  products_hero_title: 'Everything Your Business Needs',
  products_hero_subtitle: 'Browse our curated catalogue — request a quote on any item and receive pricing within 24 hours.',
  products_search_placeholder: 'Search products...',
  products_empty_title: 'No products match your search',
  products_empty_desc: 'Try a different keyword — or ask us directly. If it exists, we can source it.',
  process_hero_title: 'A Procurement Process Built on Clarity',
  process_hero_subtitle: 'Six transparent steps from your first request to lasting after-sales support.',
  process_guarantee: JSON.stringify([{value:"24 Hours",label:"Quotation turnaround"},{value:"100%",label:"Order accuracy commitment"},{value:"Dedicated",label:"Account manager support"}]),
  whyus_hero_title: 'More Than a Supplier — A Strategic Partner',
  whyus_hero_subtitle: 'Organisations across Ghana choose GNAB because we treat procurement as a partnership, not a transaction.',
  whyus_comparison_typical_title: 'Typical Procurement',
  whyus_comparison_typical_bullets: JSON.stringify(["Multiple vendors to chase","Inconsistent pricing","Slow, unclear quotations","No accountability after delivery"]),
  whyus_comparison_gnab_title: 'The GNAB Way',
  whyus_comparison_gnab_bullets: JSON.stringify(["One partner for everything","Transparent, competitive pricing","Quotation within 24 hours","After-sales support that stays"]),
  contact_hero_title: "Let's Start a Conversation",
  contact_hero_subtitle: 'Questions, requests or partnerships — our team responds within hours, not days.',
  contact_get_in_touch_title: 'Get in Touch',
  contact_get_in_touch_desc: 'Choose the channel that suits you best.',
  contact_form_title: 'Send Us a Message',
  contact_form_subtitle: 'We typically reply within a few hours.',
  contact_form_success_title: 'Message Sent Successfully',
  contact_form_success_desc: 'Thank you for contacting GNAB Business Solutions. We will respond as soon as possible.',
  quote_hero_title: 'Get Your Free Quotation',
  quote_hero_subtitle: 'Tell us what you need — receive a competitive, transparent quotation within 24 hours.',
  quote_how_it_works_title: 'How It Works',
  quote_form_title: 'Your Request Details',
  supplier_hero_title: 'Become a GNAB Supplier',
  supplier_hero_subtitle: 'Join our trusted network of suppliers and gain access to procurement opportunities across Ghana.',
  supplier_intro_desc: 'Tell us about your business and the products or services you supply. Applications are reviewed within five working days.',
  testimonials_hero_title: 'What Organisations Say About GNAB',
  testimonials_hero_subtitle: 'Real feedback from the businesses and institutions we serve across Ghana.',
  testimonials_share_title: 'Share Your Experience',
  blog_hero_title: 'Insights That Move Procurement Forward',
  blog_hero_subtitle: 'Guides, trends and company news for organisations that buy smarter.',
  // Hero highlights — gold gradient like Home COT heading
  about_hero_title_highlight: 'Seamless Procurement',
  services_hero_title_highlight: 'Every Need',
  industries_hero_title_highlight: 'Every Sector',
  products_hero_title_highlight: 'Your Business Needs',
  process_hero_title_highlight: 'Clarity',
  whyus_hero_title_highlight: 'Strategic Partner',
  contact_hero_title_highlight: 'Conversation',
  quote_hero_title_highlight: 'Free Quotation',
  supplier_hero_title_highlight: 'GNAB Supplier',
  testimonials_hero_title_highlight: 'GNAB',
  blog_hero_title_highlight: 'Procurement Forward',
  // COT per other pages — same premium design as Home COT (gold p-[1.5px] navy)
  services_cta_eyebrow: 'Custom sourcing',
  services_cta_title: 'Need Something Specific?',
  services_cta_subtitle: 'We handle custom procurement requests for unique business needs — just ask.',
  services_cta_primary_label: 'Request a Custom Quote',
  services_cta_secondary_label: 'Explore Products',
  industries_cta_eyebrow: 'Your industry',
  industries_cta_title: "Don't See Your Sector?",
  industries_cta_subtitle: 'We serve organisations of every type and size across Ghana. Tell us what you need.',
  industries_cta_primary_label: 'Request a Quote',
  industries_cta_secondary_label: 'Contact Our Team',
  products_cta_eyebrow: 'Custom sourcing',
  products_cta_title: "Can't Find What You Need?",
  products_cta_subtitle: 'Our sourcing team tracks down anything your business requires — locally or internationally.',
  products_cta_primary_label: 'Request Custom Sourcing',
  products_cta_secondary_label: 'Browse Services',
  process_cta_eyebrow: 'Start today',
  process_cta_title: 'Ready to Start Step One?',
  process_cta_subtitle: 'Tell us what you need — get a transparent quotation within 24 hours.',
  process_cta_primary_label: 'Request a Quote',
  process_cta_secondary_label: 'Talk to Our Team',
  whyus_cta_eyebrow: 'Why GNAB',
  whyus_cta_title: 'Experience the GNAB Difference',
  whyus_cta_subtitle: 'Join the organisations across Ghana already procuring smarter.',
  whyus_cta_primary_label: 'Request a Quote Today',
  whyus_cta_secondary_label: 'Talk to Our Team',
  // COT highlights — gold tails mirroring Home "Your Procurement?"
  about_cta_title_highlight: 'With Us Today',
  services_cta_title_highlight: 'Something Specific?',
  industries_cta_title_highlight: 'Your Sector?',
  products_cta_title_highlight: 'What You Need?',
  process_cta_title_highlight: 'Step One?',
  whyus_cta_title_highlight: 'GNAB Difference',
  // CTA feature strips (030) — same defaults as the previously hardcoded strip
  about_cta_feature1: '24h response',
  about_cta_feature2: '100% commitment',
  about_cta_feature3: 'No obligation until you approve',
  services_cta_feature1: '24h response',
  services_cta_feature2: '100% commitment',
  services_cta_feature3: 'No obligation until you approve',
  industries_cta_feature1: '24h response',
  industries_cta_feature2: '100% commitment',
  industries_cta_feature3: 'No obligation until you approve',
  products_cta_feature1: '24h response',
  products_cta_feature2: '100% commitment',
  products_cta_feature3: 'No obligation until you approve',
  process_cta_feature1: '24h response',
  process_cta_feature2: '100% commitment',
  process_cta_feature3: 'No obligation until you approve',
  whyus_cta_feature1: '24h response',
  whyus_cta_feature2: '100% commitment',
  whyus_cta_feature3: 'No obligation until you approve',
  // Heading design defaults
  home_hero_eyebrow_style: 'pill',
  home_hero_title_size: 'standard',
  home_hero_align: 'left',
  page_hero_eyebrow_style: 'pill',
  page_hero_align: 'center',
  page_hero_title_size: 'standard',
  cta_eyebrow_style: 'pill',
  cta_align: 'center',
  cta_title_size: 'standard',
  cta_theme: 'navy-gold',
  // Footer headings
  footer_quick_links_title: 'Quick Links',
  footer_services_title: 'Services',
  footer_contact_title: 'Contact',
  footer_heading_style: 'gold-bar',
}

const SETTINGS_CTX = createContext<SiteSettings>(DEFAULT_SETTINGS)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    ;void (async () => {
      try {
        const { data } = await supabase.from('site_settings').select('key, value')
        if (!data?.length) return
        setSettings((prev) => {
          const next = { ...prev }
          for (const { key, value } of data) {
            if (key in next && value) (next as unknown as Record<string, string>)[key] = value
          }
          return next
        })
      } catch {
        /* defaults remain */
      }
    })()
  }, [])

  // Keep browser tab favicon and OG image in sync with admin choice — truly mirrored
  // Killed complex Safari hash hack per user request (Safari ignored it, Chrome liked it, but we prefer
  // a simple, spec-compliant update that works in every browser). We now just update existing tags'
  // href/content in place — Safari, Chrome, Firefox all re-fetch when href changes.
  useEffect(() => {
    const rawHref = settings.favicon_url?.trim() || settings.logo_url?.trim() || DEFAULT_SETTINGS.favicon_url
    if (rawHref) {
      // Update every existing favicon tag in place (no removal needed)
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach((el) => {
        el.href = rawHref
      })
      // Ensure at least one favicon exists if none was present (edge)
      if (!document.querySelector('link[rel="icon"]')) {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = rawHref
        document.head.appendChild(link)
      }
    }
    const ogImage = settings.og_image_url?.trim() || settings.favicon_url?.trim() || settings.logo_url?.trim() || DEFAULT_SETTINGS.og_image_url
    if (ogImage) {
      let meta = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', 'og:image')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', ogImage)
    }
  }, [settings.favicon_url, settings.logo_url, settings.og_image_url])

  return <SETTINGS_CTX.Provider value={settings}>{children}</SETTINGS_CTX.Provider>
}

export const useSiteSettings = () => useContext(SETTINGS_CTX)

/* ------------------------------------------------------------------ */
/* Products / services / blog — public readers with graceful fallbacks */
/* ------------------------------------------------------------------ */

export interface PublicProduct {
  id: string
  name: string
  category: string | null
  short_description: string | null
  description: string | null
  image_url: string | null
  featured: boolean
}

/** DB products when present; otherwise the built-in catalogue so the site is never empty. */
export async function fetchPublicProducts(): Promise<{ products: PublicProduct[]; fromDb: boolean }> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, short_description, description, image_url, featured')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('display_order')
    if (!error && data && data.length > 0) return { products: data, fromDb: true }
  } catch {
    /* fall through */
  }
  return { products: [], fromDb: false }
}

export function fallbackProducts(): PublicProduct[] {
  return CATALOGUE.flatMap((cat) =>
    cat.products.map((p) => ({
      id: `${cat.slug}-${p.name}`,
      name: p.name,
      category: cat.title,
      short_description: p.desc,
      description: null,
      image_url: null,
      featured: false,
    }))
  )
}

export interface PublicService {
  id: string
  name: string
  category: string | null
  short_description: string | null
  full_description: string | null
  image_url: string | null
  footer_label?: string | null
  footer_path?: string | null
}

export async function fetchPublicServices(): Promise<PublicService[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, category, short_description, full_description, image_url, footer_label, footer_path')
      .eq('published', true)
      .is('deleted_at', null)
      .order('display_order')
    if (!error && data && data.length > 0) return data as PublicService[]
  } catch {
    /* fall through */
  }
  return []
}

export async function fetchFooterServices(limit = 20): Promise<PublicService[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, category, short_description, full_description, image_url, footer_label, footer_path')
      .eq('published', true)
      .eq('show_in_footer', true)
      .is('deleted_at', null)
      .order('display_order')
      .limit(limit)
    if (!error && data && data.length > 0) return data as PublicService[]
    // Fallback: if columns don't exist yet (migration not run), try without footer_* cols
    if (error && (error as unknown as { code?: string }).code === '42703') {
      const { data: fb } = await supabase.from('services').select('id, name, category, short_description, full_description, image_url').eq('published', true).is('deleted_at', null).order('display_order').limit(limit)
      if (fb && fb.length > 0) return fb.slice(0, 6) as unknown as PublicService[]
    }
  } catch {
    /* fall through */
  }
  return []
}

export interface PublicIndustry {
  id: string
  name: string
  description: string | null
  icon: string | null
  image_url: string | null
  display_order: number
}

export async function fetchPublicIndustries(): Promise<PublicIndustry[]> {
  try {
    const { data, error } = await supabase
      .from('industries')
      .select('id, name, description, icon, image_url, display_order')
      .eq('published', true)
      .is('deleted_at', null)
      .order('display_order')
    if (!error && data && data.length > 0) return data as PublicIndustry[]
  } catch {
    /* fall through */
  }
  return []
}

export interface PublicWhy {
  id: string
  title: string
  description: string | null
  icon: string | null
  image_url?: string | null
  display_order: number
}

export async function fetchPublicWhy(): Promise<PublicWhy[]> {
  try {
    const { data, error } = await supabase
      .from('why_choose_us')
      .select('id, title, description, icon, display_order, image_url')
      .eq('published', true)
      .is('deleted_at', null)
      .order('display_order')
    if (!error && data && data.length > 0) return data as PublicWhy[]
  } catch {
    /* fall through */
  }
  return []
}

export interface PublicProcessStep {
  id: string
  step_number: string
  title: string
  description: string | null
  points: string[]
  image_url: string | null
  display_order: number
}

export async function fetchPublicProcessSteps(): Promise<PublicProcessStep[]> {
  try {
    const { data, error } = await supabase
      .from('process_steps')
      .select('id, step_number, title, description, points, image_url, display_order')
      .eq('published', true)
      .is('deleted_at', null)
      .order('display_order')
    if (!error && data && data.length > 0) return data
  } catch {
    /* fall through */
  }
  return []
}

export interface SiteImage {
  id: string
  section: string
  url: string
  alt_text: string | null
  sort_order: number
  is_active: boolean
}

export const SITE_IMAGE_SECTIONS = [
  'home_hero',
  'home_about',
  'home_about_overlay',
  'home_cta',
  'about_hero',
  'about_warehouse',
  'services_hero',
  'industries_hero',
  'why_hero',
  'process_hero',
  'contact_hero',
  'blog_hero',
] as const

export async function fetchSiteImages(section: string): Promise<SiteImage[]> {
  try {
    const { data, error } = await supabase
      .from('site_images')
      .select('id, section, url, alt_text, sort_order, is_active')
      .eq('section', section)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order')
      .order('created_at')
    if (!error && data) return data
  } catch {
    /* fall through */
  }
  return []
}

export async function fetchAllSiteImages(): Promise<SiteImage[]> {
  try {
    const { data, error } = await supabase
      .from('site_images')
      .select('id, section, url, alt_text, sort_order, is_active, created_at, deleted_at')
      .is('deleted_at', null)
      .order('section')
      .order('sort_order')
    if (!error && data) return data as SiteImage[]
  } catch {
    /* fall through */
  }
  return []
}

export function useSiteImage(section: string, fallback: string): string {
  const [url, setUrl] = useState(fallback)
  useEffect(() => {
    void fetchSiteImages(section).then((rows) => {
      if (rows.length > 0 && rows[0]?.url) setUrl(rows[0].url)
    })
  }, [section])
  return url
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image_url: string | null
  author: string | null
  category: string
  tags: string[]
  status?: 'draft' | 'published' | 'archived'
  meta_title?: string | null
  meta_description?: string | null
  published_at: string | null
}

export const BLOG_CATEGORIES = [
  'Company News',
  'Guides',
  'Industry Trends',
  'Procurement Insights',
  'Supplier Updates',
] as const

export async function fetchPublishedPosts(category?: string): Promise<BlogPost[]> {
  try {
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, featured_image_url, author, category, tags, meta_title, meta_description, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    if (category) query = query.eq('category', category)
    const { data, error } = await query
    if (!error && data) return data
  } catch {
    /* fall through */
  }
  return []
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, featured_image_url, author, category, tags, meta_title, meta_description, published_at')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (!error && data) return data
  } catch {
    /* fall through */
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Home Page CMS — hero / trust / about / stats / CTA               */
/* ------------------------------------------------------------------ */

export interface HomeHero {
  id: string; badge: string; title_prefix: string; title_highlight: string; title_suffix: string
  subtitle: string; primary_label: string; primary_link: string; secondary_label: string; secondary_link: string
}
export async function fetchHomeHero(): Promise<HomeHero | null> {
  try {
    const { data, error } = await supabase.from('home_hero').select('*').eq('published', true).limit(1).maybeSingle()
    if (!error && data) return data as HomeHero
  } catch { /* fallback */ }
  return null
}

export interface HomeTrustItem { id: string; icon: string; label: string; display_order: number; published: boolean }
export async function fetchHomeTrust(): Promise<HomeTrustItem[]> {
  try {
    const { data, error } = await supabase.from('home_trust_items').select('id, icon, label, display_order, published').eq('published', true).is('deleted_at', null).order('display_order')
    if (!error && data && data.length) return data as HomeTrustItem[]
  } catch {}
  return []
}

export interface HomeAbout {
  id: string; eyebrow: string; title_prefix: string; title_highlight: string
  paragraph1: string; paragraph2: string; badge_value: string; badge_label: string
  phone: string; phone_label: string; primary_label: string; primary_link: string; image_url: string | null; overlay_url: string | null
}
export async function fetchHomeAbout(): Promise<HomeAbout | null> {
  try {
    const { data, error } = await supabase.from('home_about').select('*').eq('published', true).limit(1).maybeSingle()
    if (!error && data) return data as HomeAbout
  } catch {}
  return null
}

export interface HomeStat { id: string; value: number; suffix: string; label: string; display_order: number }
export async function fetchHomeStats(): Promise<HomeStat[]> {
  try {
    const { data, error } = await supabase.from('home_stats').select('id, value, suffix, label, display_order').eq('published', true).is('deleted_at', null).order('display_order')
    if (!error && data && data.length) return data as HomeStat[]
  } catch {}
  return []
}

export interface HomeCta {
  id: string; eyebrow: string; title_prefix: string; title_highlight: string; subtitle: string
  primary_label: string; primary_link: string; secondary_label: string; secondary_link: string
  feature1: string; feature2: string; feature3: string; bg_image_url: string | null
}
export async function fetchHomeCta(): Promise<HomeCta | null> {
  try {
    const { data, error } = await supabase.from('home_cta').select('*').eq('published', true).limit(1).maybeSingle()
    if (!error && data) return data as HomeCta
  } catch {}
  return null
}

/* Company profile — active PDF or null */
export async function fetchActiveCompanyProfile(): Promise<{ url: string; file_name: string } | null> {
  try {
    const { data } = await supabase
      .from('company_documents')
      .select('file_path, file_name')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    if (!data) return null
    return { url: getPublicUrl('documents', data.file_path), file_name: data.file_name }
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------ */
/* SEO helpers                                                         */
/* ------------------------------------------------------------------ */

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Sets <title>, description, canonical and Open Graph tags for the current page. */
export function setPageMeta(title: string, description?: string, image?: string) {
  document.title = title
  if (description) {
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:description', description)
  }
  upsertMeta('property', 'og:title', title)
  if (image) upsertMeta('property', 'og:image', image)
  // canonical — well mirrored
  let canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canon) {
    canon = document.createElement('link')
    canon.rel = 'canonical'
    document.head.appendChild(canon)
  }
  canon.href = (window.location.href.split('?')[0]?.split('#')[0] ?? window.location.href)
  upsertMeta('property', 'og:url', canon.href)
}

export function setJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function setOrganizationJsonLd() {
  setJsonLd('ld-org', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: COMPANY.name,
    url: typeof window !== 'undefined' ? window.location.origin : 'https://gnab-solutions.vercel.app',
    logo: CONTACT.logo,
    description: COMPANY.description,
    address: { '@type': 'PostalAddress', addressLocality: 'Accra', addressCountry: 'GH' },
    contactPoint: { '@type': 'ContactPoint', telephone: CONTACT.phoneRaw, contactType: 'sales', email: CONTACT.email },
  })
}
