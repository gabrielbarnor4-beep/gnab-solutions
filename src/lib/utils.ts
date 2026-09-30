import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function requireEnv(name: string): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value
}

export const FORMSPREE_ENDPOINT = requireEnv('VITE_FORMSPREE_ENDPOINT')

export const CONTACT = {
  email: 'gnabsolutions@gmail.com',
  phone: '+233 55 427 3445',
  phoneRaw: '+233554273445',
  whatsapp: '+233 27 547 3098',
  whatsappLink: 'https://wa.me/233275473098',
  address: 'Accra Business District, Greater Accra, Ghana',
  logo: 'https://dkbzvndtolkvuuxeaooh.supabase.co/storage/v1/object/public/media/branding/1788397307996-wb35sl.jpg',
} as const

export const COMPANY = {
  name: 'GNAB Business Solutions',
  shortName: 'GNAB',
  tagline: 'One Partner. Endless Solutions.',
  mission:
    'To simplify procurement through reliable sourcing, competitive pricing and timely delivery.',
  vision: "To become Ghana's most trusted procurement and supply partner.",
  description:
    "Ghana's trusted partner for corporate procurement, sourcing and supply — delivering measurable value to businesses, government, NGOs and institutions.",
} as const

export const IMAGES = {
  hero1:
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2400&auto=format&fit=crop',
  hero2:
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop',
  hero3:
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2400&auto=format&fit=crop',
  about:
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop',
  about2:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop',
  warehouse:
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop',
  logistics:
    'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1600&auto=format&fit=crop',
  signing:
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop',
  sourcing:
    'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800&auto=format&fit=crop',
  handshake:
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800&auto=format&fit=crop',
  delivery:
    'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop',
  teamwork:
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop',
  pricing:
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800&auto=format&fit=crop',
  consultant:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop',
  workshop:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
} as const

// 1A: responsive srcset for Unsplash/CDN images — phone never downloads desktop 2400w
export function imgSrcSet(url: string, widths: number[] = [400, 800, 1200, 1600]): string {
  if (!url.includes('images.unsplash.com')) return url
  return widths.map((w) => `${url.replace(/w=\d+/, `w=${w}`)}&fm=webp ${w}w`).join(', ')
}
export function imgSizes(sizes: string = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'): string {
  return sizes
}

export const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Industries', path: '/industries' },
  { name: 'Products', path: '/products' },
  { name: 'Process', path: '/process' },
  { name: 'Why Us', path: '/why-us' },
  { name: 'Blog', path: '/blog' },
  { name: 'Reviews', path: '/testimonials' },
  { name: 'Contact', path: '/contact' },
] as const

export const PRODUCT_CATEGORIES = [
  'Office Stationery & Consumables',
  'IT Equipment & Accessories',
  'Cleaning & Janitorial Supplies',
  'PPE & Safety',
  'Office Furniture',
  'Electrical Materials',
  'Automobile Services & Spares',
  'Printing & Branding',
  'General Office Consumables',
  'Custom Sourcing',
  'Other',
] as const

export const INDUSTRIES_LIST = [
  'Corporate Organisations',
  'Government Institutions',
  'Schools & Universities',
  'Hospitals',
  'Hotels',
  'Construction Companies',
  'NGOs',
  'SMEs',
] as const

// 2 + 3B: client-side rate-limit (5/min) + honeypot + file caps
const RATE_KEY_PREFIX = 'gnab_rl_'
export function canSubmit(key: string, limit = 5, windowMs = 60000): boolean {
  try {
    const raw = localStorage.getItem(RATE_KEY_PREFIX + key)
    const arr: number[] = raw ? JSON.parse(raw) : []
    const now = Date.now()
    const kept = arr.filter((t) => now - t < windowMs)
    return kept.length < limit
  } catch { return true }
}
export function recordSubmit(key: string) {
  try {
    const raw = localStorage.getItem(RATE_KEY_PREFIX + key)
    const arr: number[] = raw ? JSON.parse(raw) : []
    arr.push(Date.now())
    localStorage.setItem(RATE_KEY_PREFIX + key, JSON.stringify(arr.slice(-10)))
  } catch { /* ignore */ }
}
export function isHoneypotFilled(fd: FormData): boolean {
  // honeypot field "website_hp" must stay empty — not "website" (real company field on supplier form)
  return formStr(fd, 'website_hp').trim().length > 0
}
// Safe FormData string getter — fd.get() can return File, String(file) would be "[object File]"
export function formStr(fd: FormData, key: string): string {
  const v = fd.get(key)
  return typeof v === 'string' ? v : ''
}
export const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])
export const ALLOWED_ATTACHMENT_EXTS = new Set(['jpg','jpeg','png','webp','gif','pdf','doc','docx','xls','xlsx','txt'])
export function isAllowedAttachment(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ALLOWED_ATTACHMENT_TYPES.has(file.type) || ALLOWED_ATTACHMENT_EXTS.has(ext)
}
