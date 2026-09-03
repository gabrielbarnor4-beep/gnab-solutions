// Legacy type definitions — kept for reference. Active app types live in lib/siteData.tsx, lib/testimonials.ts and page-local Row interfaces.
export interface SiteContent {
  id: string
  section: string
  title: string
  content: string
  metadata?: Record<string, unknown>
  updated_at: string
}

export interface Service {
  id: string
  title: string
  description: string
  short_description?: string
  icon?: string
  category?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Industry {
  id: string
  title: string
  description: string
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface WhyChooseUs {
  id: string
  title: string
  description: string
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  category_id?: string
  category_name?: string
  price?: number
  image_url?: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
}

export interface Quote {
  id: string
  rfq_number?: string
  full_name: string
  company_name?: string
  email: string
  phone?: string
  whatsapp?: string
  industry?: string
  product_category?: string
  product_item?: string
  products_or_services: string
  quantity?: string
  delivery_location?: string
  message?: string
  status: 'new' | 'under_review' | 'quotation_prepared' | 'quotation_sent' | 'awaiting_response' | 'won' | 'lost' | 'closed'
  assigned_to?: string
  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  company_name: string
  contact_person: string
  email: string
  phone: string
  whatsapp?: string
  business_address?: string
  website?: string
  business_registration?: string
  tin_number?: string
  business_category?: string
  categories?: string[]
  products_supplied?: string
  years_in_business?: string
  areas_of_operation?: string
  company_description?: string
  additional_info?: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image?: string
  author?: string
  category: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  created_at: string
  updated_at: string
}

export interface SiteSettings {
  id: string
  company_name?: string
  tagline?: string
  company_description?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  logo_url?: string
  favicon_url?: string
  social_linkedin?: string
  social_facebook?: string
  social_twitter?: string
  social_instagram?: string
  seo_title?: string
  seo_description?: string
  footer_text?: string
  updated_at: string
}

export interface SiteImage {
  id: string
  url: string
  alt_text?: string
  section: string
  sort_order: number
  is_active: boolean
  created_at: string
}
