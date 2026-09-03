import { supabase } from '@/lib/supabase'
import { FORMSPREE_ENDPOINT } from '@/lib/utils'

export interface Testimonial {
  id: string
  client_name: string
  client_role: string | null
  company: string | null
  rating: number
  quote: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface TestimonialSubmission {
  client_name: string
  client_role?: string
  company?: string
  rating: number
  quote: string
}

export interface PublicTestimonial extends Omit<Testimonial, 'status'> {
  isSample?: boolean
}

/* Shown on the site until real approvals exist in Supabase — always labelled "Sample" in the UI */
export const DEFAULT_TESTIMONIALS: PublicTestimonial[] = [
  {
    id: 'default-1',
    isSample: true,
    created_at: new Date(2026, 0, 11).toISOString(),
    client_name: 'Procurement Director',
    client_role: 'Procurement Director',
    company: 'Leading Financial Institution, Accra',
    rating: 5,
    quote:
      'GNAB transformed how we handle procurement. One call, one quote, everything delivered ahead of schedule. They are an extension of our team.',
  },
  {
    id: 'default-2',
    isSample: true,
    created_at: new Date(2026, 0, 21).toISOString(),
    client_name: 'Operations Manager',
    client_role: 'Operations Manager',
    company: 'Regional Hospital Network',
    rating: 5,
    quote:
      'Their response time is unmatched. Quotation within hours, delivery within days — even for bulk orders across multiple regions.',
  },
  {
    id: 'default-3',
    isSample: true,
    created_at: new Date(2026, 0, 31).toISOString(),
    client_name: 'Administrative Lead',
    client_role: 'Administrative Lead',
    company: 'International NGO, Ghana',
    rating: 5,
    quote:
      'From stationery to full IT setups, GNAB handles it all with professionalism. Their pricing saved us over 20% last year.',
  },
]

/** Fetch admin-approved testimonials; falls back to defaults if table missing/empty. */
export async function fetchApprovedTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, client_name, client_role, company, rating, quote, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (!error && data && data.length > 0) return data
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_TESTIMONIALS
}

/**
 * Save a new testimonial as PENDING in Supabase and email the business via Formspree.
 * The business approves (publishes) or rejects (deletes) it from /admin/testimonials.
 */
export async function submitTestimonial(sub: TestimonialSubmission): Promise<void> {
  // 1. Store as pending — never trust client-supplied status
  let stored = false
  try {
    const { error } = await supabase.from('testimonials').insert({
      client_name: sub.client_name,
      client_role: sub.client_role || null,
      company: sub.company || null,
      rating: sub.rating,
      quote: sub.quote,
    })
    stored = !error
  } catch {
    /* table may not exist yet — email still notifies the business */
  }

  // 2. Notify the business by email (Formspree)
  try {
    await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'New Testimonial Awaiting Approval - GNAB Website',
        name: sub.client_name,
        role_company: [sub.client_role, sub.company].filter(Boolean).join(', ') || '-',
        rating: `${sub.rating} / 5`,
        testimonial: sub.quote,
        approval_note: stored
          ? `Saved as PENDING. Approve or reject at the GNAB admin portal (/admin/testimonials).`
          : `WARNING: could not save to database. Approve manually by adding this testimonial.`,
      }),
    })
  } catch {
    /* non-fatal */
  }
}
